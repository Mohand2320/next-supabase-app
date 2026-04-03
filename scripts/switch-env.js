#!/usr/bin/env node

/**
 * Script pour gérer les environnements DEV/PROD
 * Utilisation:
 *   node scripts/switch-env.js dev   # Bascule vers DEV
 *   node scripts/switch-env.js prod  # Bascule vers PROD
 *   node scripts/switch-env.js show  # Affiche l'env actuel
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const ENV_DEV = path.join(ROOT, '.env.development');
const ENV_PROD = path.join(ROOT, '.env.production');
const ENV_LOCAL = path.join(ROOT, '.env.local');

const command = process.argv[2]?.toLowerCase();

function showEnv() {
  if (!fs.existsSync(ENV_LOCAL)) {
    console.log('ℹ️  Aucun .env.local actif - utilisant .env.development');
    return;
  }
  
  const content = fs.readFileSync(ENV_LOCAL, 'utf-8');
  const isDev = content.includes('dev');
  console.log(`📍 Environnement actuel: ${isDev ? '🟢 DEV' : '🔴 PROD'}`);
}

function switchEnv(target) {
  if (!['dev', 'prod', 'development', 'production'].includes(target)) {
    console.error('❌ Usage: node scripts/switch-env.js [dev|prod|show]');
    process.exit(1);
  }

  const isProd = target.includes('prod');
  const sourceFile = isProd ? ENV_PROD : ENV_DEV;
  const sourceFileName = isProd ? '.env.production' : '.env.development';

  if (!fs.existsSync(sourceFile)) {
    console.error(`❌ Fichier ${sourceFileName} introuvable`);
    process.exit(1);
  }

  try {
    const content = fs.readFileSync(sourceFile, 'utf-8');
    fs.writeFileSync(ENV_LOCAL, content);
    console.log(`✅ Basculé vers: ${isProd ? '🔴 PROD' : '🟢 DEV'}`);
    console.log(`📁 ${sourceFileName} → .env.local`);
  } catch (error) {
    console.error(`❌ Erreur: ${error.message}`);
    process.exit(1);
  }
}

if (command === 'show' || !command) {
  showEnv();
} else if (command === 'dev' || command === 'development') {
  switchEnv('dev');
} else if (command === 'prod' || command === 'production') {
  switchEnv('prod');
} else {
  console.error('❌ Commande inconnue');
  console.log('Usage: node scripts/switch-env.js [dev|prod|show]');
  process.exit(1);
}
