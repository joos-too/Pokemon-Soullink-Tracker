import React from "react";

interface EditableCellProps {
  value: string | number;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  isBold?: boolean;
}

const EditableCell: React.FC<EditableCellProps> = ({
  value,
  onChange,
  placeholder = "",
  className = "",
  isBold = false,
}) => {
  return (
    <td className={`p-0 ${className}`}>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={`w-full h-full bg-transparent border-none outline-none px-2 py-1.5 text-center text-sm focus:bg-gray-100 dark:focus:bg-gray-600 text-gray-800 dark:text-gray-200 ${isBold ? "font-bold" : ""}`}
      />
    </td>
  );
};

export default EditableCell;
