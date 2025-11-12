// Dynamically import all strategy files using webpack's require.context
// This is the Next.js equivalent of Vite's import.meta.glob

// Type declaration for webpack's require.context
interface RequireContext {
  keys(): string[];
  (id: string): any;
  <T>(id: string): T;
  resolve(id: string): string;
  id: string;
}

// Get all .tsx files in the current directory (excluding index.ts)
const strategyModules = (require as any).context("./", false, /\.tsx$/) as RequireContext;

const strategies: Record<string, any> = {};

// Iterate through all found modules
strategyModules.keys().forEach((fileName: string) => {
  // Remove './' prefix and '.tsx' extension
  const moduleName = fileName.replace("./", "").replace(".tsx", "");
  
  // Import the module
  const module = strategyModules(fileName);
  
  // Extract all named exports from the module
  // Each strategy file exports a class (e.g., AlwaysCooperate, AlwaysDefect, SelfPlay)
  Object.keys(module).forEach((exportName) => {
    if (exportName !== "default") {
      strategies[exportName] = module[exportName];
    }
  });
});

// Re-export all strategies as named exports for compatibility

export default strategies;
