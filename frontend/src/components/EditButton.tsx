import React from 'react';
import { Edit2 } from 'lucide-react';

interface EditButtonProps {
  onClick: (e: React.MouseEvent) => void;
  size?: 'sm' | 'md';
  withText?: boolean;
  className?: string;
}

const EditButton: React.FC<EditButtonProps> = ({ 
  onClick, 
  size = 'md',
  withText = false,
  className = ''
}) => {
  const iconSize = size === 'sm' ? 16 : 18;
  const baseClasses = 'text-blue-600 hover:text-blue-900';
  
  if (withText) {
    return (
      <button 
        onClick={onClick}
        className={`${baseClasses} text-sm font-medium flex items-center ${className}`}
      >
        <Edit2 size={iconSize} className="mr-2" />
        Modifier
      </button>
    );
  }

  return (
    <button 
      onClick={onClick}
      className={`${baseClasses} ${className}`}
    >
      <Edit2 size={iconSize} />
    </button>
  );
};

export default EditButton;