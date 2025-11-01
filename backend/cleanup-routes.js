// Script to identify and remove bad routes from database
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

async function analyzeRoutes() {
  console.log('🔍 Analyzing routes in database...\n');

  // Fetch all routes
  const { data: routes, error } = await supabase
    .from('routes')
    .select('id, name, distance_km, difficulty, created_at')
    .order('distance_km', { ascending: false });

  if (error) {
    console.error('Error fetching routes:', error);
    return;
  }

  console.log(`📊 Total routes: ${routes.length}\n`);

  // Identify problematic routes
  const problematicRoutes = [];

  routes.forEach((route) => {
    const issues = [];

    // Check for unrealistic distances (> 100km for hiking)
    if (route.distance_km > 100) {
      issues.push(`EXTREME distance: ${route.distance_km}km`);
    }

    // Check for zero distance
    if (route.distance_km === 0) {
      issues.push('ZERO distance');
    }

    if (issues.length > 0) {
      problematicRoutes.push({
        ...route,
        issues,
      });
    }
  });

  // Display problematic routes
  if (problematicRoutes.length > 0) {
    console.log(`⚠️  Found ${problematicRoutes.length} problematic routes:\n`);
    problematicRoutes.forEach((route, index) => {
      console.log(`${index + 1}. ${route.name}`);
      console.log(`   ID: ${route.id}`);
      console.log(`   Distance: ${route.distance_km}km`);
      console.log(`   Issues: ${route.issues.join(', ')}`);
      console.log(`   Created: ${new Date(route.created_at).toLocaleString('cs-CZ')}\n`);
    });

    // Ask for confirmation to delete
    console.log('🗑️  Delete these routes? (y/n)');
    console.log('   Run: node cleanup-routes.js delete');

  } else {
    console.log('✅ No problematic routes found!');
  }

  return problematicRoutes;
}

async function deleteProblematicRoutes() {
  const problematicRoutes = await analyzeRoutes();

  if (!problematicRoutes || problematicRoutes.length === 0) {
    return;
  }

  if (process.argv[2] === 'delete') {
    console.log('\n🗑️  Deleting problematic routes...\n');

    for (const route of problematicRoutes) {
      const { error } = await supabase
        .from('routes')
        .delete()
        .eq('id', route.id);

      if (error) {
        console.log(`❌ Failed to delete: ${route.name}`);
      } else {
        console.log(`✅ Deleted: ${route.name} (${route.distance_km}km)`);
      }
    }

    console.log('\n✅ Database cleanup complete!');
  }
}

// Run
deleteProblematicRoutes().catch(console.error);
