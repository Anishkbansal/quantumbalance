import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

// Files to process
const extensions = ['.tsx', '.ts', '.js'];
const ignorePaths = ['node_modules', 'build', 'public'];

// Find all matching files
function findFiles(dir, files = []) {
  const dirContents = fs.readdirSync(dir);
  
  for (const item of dirContents) {
    const fullPath = path.join(dir, item);
    
    // Skip ignored directories
    if (fs.statSync(fullPath).isDirectory()) {
      if (!ignorePaths.includes(item)) {
        findFiles(fullPath, files);
      }
      continue;
    }
    
    // Only process files with the specified extensions
    if (extensions.includes(path.extname(fullPath))) {
      files.push(fullPath);
    }
  }
  
  return files;
}

// Process a file to replace hardcoded URLs
function processFile(filePath) {
  console.log(`Processing ${filePath}...`);
  
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    const originalContent = content;
    
    // Regular expression to match http://localhost:5000/api
    const regex = /(['"`])http:\/\/localhost:5000\/api([\/\w-]*)\1/g;
    
    // Check if the file needs updating
    if (!regex.test(content)) {
      return false;
    }
    
    // Reset regex state
    regex.lastIndex = 0;
    
    // Check if file already imports API_URL
    const hasApiUrlImport = content.includes('import { API_URL }') || 
                            content.includes('import {API_URL}') ||
                            content.includes('from \'../config/constants\'') ||
                            content.includes('from \'../../config/constants\'');
    
    // Replace hardcoded URLs with API_URL
    content = content.replace(regex, (match, quote, path) => {
      return `${quote}\${API_URL}${path}${quote}`;
    });
    
    // Add import if needed
    if (!hasApiUrlImport) {
      // Find a good place to add the import
      const importRegex = /import .* from ['"][^'"]+['"];?\n(?!import)/;
      const match = content.match(importRegex);
      
      if (match) {
        const insertPosition = match.index + match[0].length;
        const relativePath = path.relative(path.dirname(filePath), path.join(rootDir, 'config')).replace(/\\/g, '/');
        const importStatement = `import { API_URL } from '${relativePath.startsWith('.') ? relativePath : './' + relativePath}/constants';\n`;
        content = content.slice(0, insertPosition) + importStatement + content.slice(insertPosition);
      }
    }
    
    // Check if content was changed
    if (content !== originalContent) {
      fs.writeFileSync(filePath, content);
      console.log(`  ✓ Updated file: ${filePath}`);
      return true;
    } else {
      return false;
    }
  } catch (error) {
    console.error(`  ✗ Error processing ${filePath}:`, error.message);
    return false;
  }
}

// Main function
async function main() {
  console.log('Scanning for files with hardcoded localhost:5000 URLs...');
  
  const files = findFiles(rootDir);
  console.log(`Found ${files.length} files to check.`);
  
  let updatedFiles = 0;
  let updatedFilesList = [];
  
  for (const file of files) {
    const updated = processFile(file);
    if (updated) {
      updatedFiles++;
      updatedFilesList.push(file);
    }
  }
  
  console.log(`\nCompleted! Updated ${updatedFiles} files.`);
  console.log('\nUpdated files:');
  updatedFilesList.forEach(file => {
    console.log(`- ${path.relative(rootDir, file)}`);
  });
}

main().catch(console.error); 