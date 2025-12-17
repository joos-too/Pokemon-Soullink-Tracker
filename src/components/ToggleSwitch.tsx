import React from "react";

export interface ToggleSwitchProps {
  id: string;
  checked: boolean;
  onChange: (enabled: boolean) => void;
  ariaLabel?: string;
  disabled?: boolean;
}

const ToggleSwitch: React.FC<ToggleSwitchProps> = ({
  id,
  checked,
  onChange,
  ariaLabel,
  disabled,
}) => {
  const trackClasses = `relative block w-11 h-6 rounded-full transition-colors duration-200 ease-out pointer-events-none ${
    checked ? "bg-green-500" : "bg-gray-200 dark:bg-gray-700"
  } ${disabled ? "opacity-60" : ""}`;
  const thumbClasses = `absolute top-[2px] left-[2px] h-5 w-5 transform rounded-full bg-white shadow transition duration-200 ease-out pointer-events-none ${
    checked ? "translate-x-5" : ""
  }`;

  return (
    <label
      htmlFor={id}
      className={`inline-flex items-center rounded-full p-1 ${
        disabled ? "cursor-not-allowed" : "cursor-pointer"
      } focus-within:outline-none focus-within:ring-2 focus-within:ring-green-500 focus-within:ring-offset-2 focus-within:ring-offset-white dark:focus-within:ring-offset-gray-900`}
    >
      <input
        type="checkbox"
        id={id}
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        disabled={disabled}
        className="sr-only"
        aria-label={ariaLabel}
      />
      <span aria-hidden="true" className={trackClasses}>
        <span className={thumbClasses} />
      </span>
    </label>
  );
};

export default ToggleSwitch;
