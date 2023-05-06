const fs = require("fs");
const path = require("path");

function bundle(entryFile) {
  // read the entry file
  const entryContent = fs.readFileSync(entryFile, "utf8");

  // recursively find all imported modules
  const modules = findModules(entryFile);

  // create the bundled code
  const bundledCode = modules.map((module) => module.code).join("\n");

  return bundledCode;

  function findModules(file) {
    const content = fs.readFileSync(file, "utf8");

    // find all import statements
    const importRegex = /import\s+(?:.+\s+from\s+)?['"](.+)['"]/g;
    let match;
    const modules = [];

    while ((match = importRegex.exec(content)) !== null) {
      const importPath = match[1];
      const resolvedPath = path.resolve(path.dirname(file), importPath);

      // skip if we've already included this module
      if (modules.some((module) => module.path === resolvedPath)) {
        continue;
      }

      // recursively find modules from the imported file
      const importedModules = findModules(resolvedPath);

      // add the imported modules to the list
      modules.push(...importedModules);

      // add the module itself to the list
      modules.push({
        path: resolvedPath,
        code:
          importedModules.length > 0
            ? `const ${path.basename(
                importPath,
                ".js"
              )} = (() => {\n${fs.readFileSync(
                resolvedPath,
                "utf8"
              )}\nreturn ${path.basename(importPath, ".js")};\n})();`
            : `const ${path.basename(importPath, ".js")} = {}`,
      });
    }

    // add this module to the list
    modules.push({
      path: file,
      code: content.replace(importRegex, (match, importPath) => {
        const resolvedPath = path.resolve(path.dirname(file), importPath);
        const module = modules.find((module) => module.path === resolvedPath);
        return `import ${
          module ? module.path.replace(/\\/g, "/") : importPath
        }`;
      }),
    });

    return modules;
  }
}

module.exports = bundle;
