import * as React from 'react';
import { Edit2, Save, X } from 'lucide-react';

export interface EditButtonProps {
  onClick?: (e: React.MouseEvent) => void;
  size?: 'sm' | 'md';
  withText?: boolean;
  className?: string;
  // New props for edit mode functionality
  isEditing?: boolean;
  onEdit?: () => void;
  onSave?: () => void;
  onCancel?: () => void;
}

const EditButton: React.FC<EditButtonProps> = ({ 
  onClick, 
  size = 'md',
  withText = false,
  className = '',
  isEditing = false,
  onEdit,
  onSave,
  onCancel
}) => {
  const iconSize = size === 'sm' ? 16 : 18;
  const baseClasses = 'text-blue-600 hover:text-blue-900';
  
  // If we're using the edit mode functionality
  if (onEdit !== undefined && onSave !== undefined && onCancel !== undefined) {
    if (isEditing) {
      return (
        <div className="flex space-x-2">
          <button 
            onClick={onSave}
            className="text-green-600 hover:text-green-900"
            title="Save"
          >
            <Save size={iconSize} />
          </button>
          <button 
            onClick={onCancel}
            className="text-red-600 hover:text-red-900"
            title="Cancel"
          >
            <X size={iconSize} />
          </button>
        </div>
      );
    } else {
      return (
        <button 
          onClick={onEdit}
          className={`${baseClasses} ${className}`}
          title="Edit"
        >
          <Edit2 size={iconSize} />
        </button>
      );
    }
  }
  
  // Original functionality
  if (withText && onClick) {
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