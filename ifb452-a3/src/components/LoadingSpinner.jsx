// Loading spinner elemenet shown during grid loading
const LoadingSpinner = () => {
  return (
    <div className="w-full flex items-center justify-center bg-transparent z-10">
      <div className="flex flex-col items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-600"></div>
      </div>
    </div>
  );
};

export default LoadingSpinner;