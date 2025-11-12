"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { validateCode, testCompilation } from "@/utils/code-security";
import { COOPERATE, DEFECT } from "@/constants";

const Editor = dynamic(() => import("@monaco-editor/react").then(mod => mod.default), {
  ssr: false,
  loading: () => <div className="flex items-center justify-center h-full bg-gray-50">Loading editor...</div>
});

interface CodeEditorProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (code: string) => void;
  initialCode?: string;
  compact?: boolean;
}

const DEFAULT_CODE = `// your strategy here
// DEFECT to defect
// COOPERATE to cooperate
return COOPERATE;`;

const STRATEGY_TEMPLATE = `// Write only the function body, not a function declaration
// You have access to: opponent_history (string[])
// Return: COOPERATE or DEFECT
// Example:
return COOPERATE;`;

export default function CodeEditor({ isOpen, onClose, onSave, initialCode, compact = false }: CodeEditorProps) {
  const [code, setCode] = useState(initialCode || DEFAULT_CODE);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      console.log("Loading code from localStorage");
      // Load code from localStorage when editor opens
      let savedCode = typeof window !== 'undefined' 
        ? localStorage.getItem('customStrategyCode') || DEFAULT_CODE
        : DEFAULT_CODE;
      
      // Validate the loaded code - if it's invalid, reset to default
      // This handles cases where old invalid code might be saved
      if (savedCode && savedCode !== DEFAULT_CODE) {
        const validation = validateCode(savedCode);
        if (!validation.isValid) {
          console.warn("Invalid code found in localStorage, resetting to default:", validation.error);
          savedCode = DEFAULT_CODE;
          if (typeof window !== 'undefined') {
            localStorage.setItem('customStrategyCode', DEFAULT_CODE);
          }
        }
      }
      
      setCode(savedCode);
      setError(null);
    }
  }, [isOpen]);

  const handleSave = async () => {
    try {
      // Validate code for security issues (pre-check before sending to worker)
      const validation = validateCode(code);
      if (!validation.isValid) {
        setError(validation.error || 'Invalid code');
        return;
      }

      // Test compilation and execution using Web Worker
      try {
        await testCompilation(code, COOPERATE, DEFECT);
        
        console.log("Code compiled and tested successfully in Web Worker");
        
        // Save to localStorage
        if (typeof window !== 'undefined') {
          localStorage.setItem('customStrategyCode', code);
          console.log("Code saved to localStorage:", code);
        }
        
        setError(null);
        onSave(code);
        // Don't close automatically - user can keep editing inline
      } catch (compileError) {
        console.error('Compilation/execution error:', compileError);
        setError(`Code execution failed: ${compileError instanceof Error ? compileError.message : 'Unknown error'}`);
      }
    } catch (err) {
      console.log(err);
      setError(err instanceof Error ? err.message : 'Invalid code syntax');
    }
  };

  const handleReset = () => {
    setCode(DEFAULT_CODE);
    setError(null);
  };

  if (!isOpen) return null;

  return (
    <div className={`w-full bg-white rounded-lg shadow-lg border border-gray-200 flex flex-col ${compact ? 'text-sm' : ''}`}>
      {/* Header */}
      <div className={`${compact ? 'px-4 py-2' : 'px-6 py-4'} border-b border-gray-200 flex items-center justify-between`}>
        <h2 className={`${compact ? 'text-lg' : 'text-xl'} font-bold text-black`}>Edit Custom Strategy</h2>
        <button
          onClick={onClose}
          className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
        >
          ×
        </button>
      </div>

      {/* Info section */}
      {!compact && (
        <div className="px-6 py-3 bg-blue-50 border-b border-gray-200">
          <div className="text-sm text-gray-700">
            <p className="font-semibold mb-1">Instructions:</p>
            <p className="text-xs text-gray-600 mb-2">
              Write only the function body code. <strong>Do not</strong> write a function declaration. The function wrapper is added automatically.
            </p>
            <code className="bg-gray-100 px-2 py-1 rounded text-xs block mb-2">
              {STRATEGY_TEMPLATE}
            </code>
            <p className="text-xs text-gray-600">
              <strong>Available variables:</strong> <code className="bg-gray-100 px-1 rounded">opponent_history</code> (string[])
              <br />
              <strong>Return:</strong> <code className="bg-gray-100 px-1 rounded">COOPERATE</code> or <code className="bg-gray-100 px-1 rounded">DEFECT</code>
            </p>
          </div>
        </div>
      )}

      {/* Editor */}
      <div className="flex flex-col">
        <div className={`${compact ? 'px-4 py-1' : 'px-6 py-2'} bg-gray-50 border-b border-gray-200`}>
          <span className={`${compact ? 'text-xs' : 'text-sm'} font-medium text-gray-700`}>Strategy Code:</span>
        </div>
        <div style={{ height: compact ? '250px' : '400px', width: '100%' }}>
          <Editor
            height="100%"
            defaultLanguage="javascript"
            value={code}
            onChange={(value) => {
              setCode(value || DEFAULT_CODE);
              setError(null);
            }}
            theme="vs-light"
            options={{
              minimap: { enabled: !compact },
              fontSize: compact ? 12 : 14,
              lineNumbers: 'on',
              scrollBeyondLastLine: false,
              automaticLayout: true,
            }}
          />
        </div>
      </div>

      {/* Error message */}
      {error && (
        <div className={`${compact ? 'px-4 py-2' : 'px-6 py-3'} bg-red-50 border-t border-red-200`}>
          <p className={`${compact ? 'text-xs' : 'text-sm'} text-red-700`}>
            <strong>Error:</strong> {error}
          </p>
        </div>
      )}

      {/* Footer */}
      <div className={`${compact ? 'px-4 py-2' : 'px-6 py-4'} border-t border-gray-200 flex items-center justify-between ${compact ? 'flex-wrap gap-2' : ''}`}>
        <button
          onClick={handleReset}
          className={`${compact ? 'px-3 py-1 text-xs' : 'px-4 py-2 text-sm'} bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition-colors font-medium`}
        >
          Reset to Default
        </button>
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className={`${compact ? 'px-3 py-1 text-xs' : 'px-4 py-2 text-sm'} bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition-colors font-medium`}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className={`${compact ? 'px-3 py-1 text-xs' : 'px-4 py-2 text-sm'} bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors font-medium`}
          >
            Save Strategy
          </button>
        </div>
      </div>
    </div>
  );
}

