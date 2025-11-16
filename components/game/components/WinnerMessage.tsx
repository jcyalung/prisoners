interface WinnerMessageProps {
  message: string | null;
  color: string;
}

export function WinnerMessage({ message, color }: WinnerMessageProps) {
  if (!message) return null;

  return (
    <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50">
      <div className={`px-4 sm:px-6 md:px-8 py-2 sm:py-3 md:py-4 rounded-lg shadow-lg text-white font-bold text-base sm:text-lg md:text-xl ${color}`}>
        {message}
      </div>
    </div>
  );
}

