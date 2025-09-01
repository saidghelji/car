import { X } from 'lucide-react';

interface CloseButtonProps {
  onClick: () => void;
  className?: string;
}

const CloseButton = ({ onClick, className }: CloseButtonProps) => {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`absolute top-4 right-4 text-gray-400 hover:text-gray-600 focus:outline-none ${className}`}
      aria-label="Close"
    >
      <X size={24} />
    </button>
  );
};

export default CloseButton;
