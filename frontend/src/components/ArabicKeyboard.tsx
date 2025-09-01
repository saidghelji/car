import React, { useState, useEffect } from 'react';
import Keyboard from 'react-simple-keyboard';
import 'react-simple-keyboard/build/css/index.css';

interface ArabicKeyboardProps {
  isOpen: boolean;
  onClose: () => void;
  onInput: (value: string) => void;
  initialValue?: string;
}

const ArabicKeyboard: React.FC<ArabicKeyboardProps> = ({ isOpen, onClose, onInput, initialValue }) => {
  const [layoutName, setLayoutName] = useState('default');
  const [internalInput, setInternalInput] = useState(initialValue || '');

  useEffect(() => {
    setInternalInput(initialValue || '');
  }, [initialValue, isOpen]);

  const handleKeyPress = (button: string) => {
    if (button === '{shift}' || button === '{lock}') {
      setLayoutName(layoutName === 'default' ? 'shift' : 'default');
    } else if (button === '{enter}') {
      onClose();
    }
  };

  const handleChange = (input: string) => {
    setInternalInput(input);
    onInput(input);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white p-4 rounded-lg shadow-lg w-full max-w-3xl">
        <div className="flex justify-between items-center mb-2">
          <h3 className="text-lg font-semibold">Clavier Arabe</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-800">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <input
          type="text"
          value={internalInput}
          onChange={(e) => handleChange(e.target.value)}
          className="w-full p-2 border rounded mb-4 text-right"
          dir="rtl"
        />
        <div dir="ltr">
          <Keyboard
            layoutName={layoutName}
            onChange={handleChange}
            onKeyPress={handleKeyPress}
            inputName="arabicInput"
            layout={{
              default: [
                'ذ 1 2 3 4 5 6 7 8 9 0 - = {bksp}',
                '{tab} ض ص ث ق ف غ ع ه خ ح ج د \\',
                '{lock} ش س ي ب ل ا ت ن م ك ط {enter}',
                '{shift} ئ ء ؤ ر ى ة و ز ظ {shift}',
                '{space} @ .com',
              ],
              shift: [
                '~ ! @ # $ % ^ & * ( ) _ + {bksp}',
                '{tab} Q W E R T Y U I O P { } |',
                '{lock} A S D F G H J K L : " {enter}',
                '{shift} Z X C V B N M < > ? {shift}',
                '{space} @ .com',
              ],
            }}
            display={{
              '{bksp}': '⌫',
              '{enter}': 'Terminé',
              '{shift}': '⇧',
              '{lock}': '⇪',
              '{tab}': '⇥',
              '{space}': ' ',
            }}
            input={internalInput}
          />
        </div>
      </div>
    </div>
  );
};

export default ArabicKeyboard;
