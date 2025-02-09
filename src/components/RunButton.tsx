import { useStore } from '../nodes/index';


interface RunButtonProps {
  onRun: () => void;
}

export function RunButton({ onRun }: RunButtonProps) {
  const runFlow = useStore(state => state.runFlow);

  const handleClick = async () => {
    console.log("Starting flow execution...");
    onRun(); // Open the panel
    await runFlow(); // Run the flow sequence
  };

  return (
    <button
      onClick={handleClick}
      className="absolute text-lg top-4 right-4 bg-pink-100 hover:bg-pink-200 text-pink-500 font-semibold py-2 px-4 rounded-lg border border-pink-500 transition-colors z-50 flex items-center gap-2"
    >
      Run Flow
    </button>
  );
}
