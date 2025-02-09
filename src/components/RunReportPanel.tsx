import { useStore } from '../nodes/index';
import { useEffect, useState } from 'react';

interface RunReportPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export function RunReportPanel({ isOpen, onClose }: RunReportPanelProps) {

  const [steps, setSteps] = useState([
    { name: 'Fetch Messages', status: 'pending' },
    { name: 'Process Orders', status: 'pending' },
    { name: 'Send Receipts', status: 'pending' }
  ]);

  // Subscribe to store updates
  const conversations = useStore(state => state.conversations);
  const processedOrders = useStore(state => state.processedOrders);
  const isStage3Complete = useStore(state => state.isStage3Complete);

  // Update steps based on store changes
  useEffect(() => {
    if (conversations.length > 0) {
      setSteps(prev => prev.map((step, index) => 
        index === 0 ? { ...step, status: 'completed' } : step
      ));
    }
  }, [conversations]);

  useEffect(() => {
    if (processedOrders.length > 0) {
      setSteps(prev => prev.map((step, index) => 
        index === 1 ? { ...step, status: 'completed' } : step
      ));
    }
  }, [processedOrders]);

  useEffect(() => {
    if (isStage3Complete) {
      setSteps(prev => prev.map((step, index) => 
        index === 2 ? { ...step, status: 'completed' } : step
      ));
    }
  }, [isStage3Complete]);

  if (!isOpen) return null;

  return (
    <div
      className={`fixed top-20 right-4 h-[90vh] w-96 bg-white border border-gray-200 rounded-lg transform transition-transform duration-300 ease-in-out ${
        isOpen ? "translate-x-0" : "translate-x-full"
      } z-40`}
    >
      <div className="flex justify-between items-center p-4 border-b">
        <h2 className="text-xl font-bold">Run Report</h2>
        <button
          onClick={onClose}
          className="text-gray-500 hover:text-gray-700 p-1"
        >
          ✕
        </button>
      </div>
      <div className="p-4 text-gray-600">
      <div className="space-y-4">
        {steps.map((step, index) => (
          <div
            key={step.name}
            className="flex items-center gap-3"
          >
            <div className={`
              w-6 h-6 rounded-full flex items-center justify-center
              ${step.status === 'completed' ? 'bg-green-500' : 
                step.status === 'pending' ? 'bg-gray-200' : 'bg-blue-500'}
            `}>
              {step.status === 'completed' && (
                <svg
                  className="w-4 h-4 text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              )}
            </div>
            <span className={`
              ${step.status === 'completed' ? 'text-green-600' : 
                step.status === 'pending' ? 'text-gray-500' : 'text-blue-600'}
            `}>
              {step.name}
            </span>
          </div>
        ))}
      </div>
      </div>
    </div>
  );
}
