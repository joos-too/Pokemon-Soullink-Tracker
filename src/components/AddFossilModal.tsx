import React, { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { FOSSILS } from "@/constants";
import { focusRingInputClasses } from "@/src/styles/focusRing";
import { FiX } from "react-icons/fi";

interface AddFossilModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (fossilId: string, location: string, inBag: boolean) => void;
  maxGeneration: number;
  alreadyOwnedIds: string[];
}

const AddFossilModal: React.FC<AddFossilModalProps> = ({
  isOpen,
  onClose,
  onAdd,
  maxGeneration,
  alreadyOwnedIds,
}) => {
  const { t } = useTranslation();
  const [selectedFossilId, setSelectedFossilId] = useState("");
  const [location, setLocation] = useState("");
  const [inBag, setInBag] = useState(true);

  const availableFossils = useMemo(() => {
    return FOSSILS.filter(
      (f) => f.gen <= maxGeneration && !alreadyOwnedIds.includes(f.id),
    );
  }, [maxGeneration, alreadyOwnedIds]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFossilId) return;
    onAdd(selectedFossilId, inBag ? "" : location, inBag);
    setSelectedFossilId("");
    setLocation("");
    setInBag(true);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
      <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold dark:text-gray-100">
            {t("modals.addFossil.title")}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
          >
            <FiX size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
              {t("modals.addFossil.fossilLabel")}
            </label>
            <div className="grid grid-cols-3 gap-2 p-1">
              {availableFossils.map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setSelectedFossilId(f.id)}
                  className={`flex flex-col items-center p-2 rounded-md border transition-all ${
                    selectedFossilId === f.id
                      ? "border-green-500 bg-green-50 dark:bg-green-900/20"
                      : "border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700"
                  }`}
                >
                  <img
                    src={`/fossil-sprites/${f.sprite}`}
                    alt={f.id}
                    className="w-10 h-10 object-contain"
                    style={{ imageRendering: "pixelated" }}
                  />
                  <span className="text-[10px] mt-1 text-center dark:text-gray-200">
                    {t(`fossils.${f.id}`)}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2 py-2">
            <input
              type="checkbox"
              id="inBag"
              checked={inBag}
              onChange={(e) => setInBag(e.target.checked)}
              className="h-4 w-4 accent-green-600 cursor-pointer"
            />
            <label
              htmlFor="inBag"
              className="text-sm font-semibold dark:text-gray-200 cursor-pointer"
            >
              {t("modals.addFossil.inBagLabel")}
            </label>
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">
              {t("modals.addFossil.locationLabel")}
            </label>
            <input
              type="text"
              value={inBag ? "" : location}
              disabled={inBag}
              onChange={(e) => setLocation(e.target.value)}
              className={`w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 disabled:opacity-50 disabled:cursor-not-allowed ${focusRingInputClasses}`}
              placeholder={inBag ? "" : "z. B. Route 1"}
            />
          </div>

          <div className="mt-6 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-md border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              {t("common.cancel")}
            </button>
            <button
              type="submit"
              disabled={!selectedFossilId || (!inBag && !location.trim())}
              className={`px-4 py-2 rounded-md font-semibold shadow ${
                selectedFossilId && (inBag || location.trim())
                  ? "bg-green-600 text-white hover:bg-green-700"
                  : "bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed"
              }`}
            >
              {t("modals.addFossil.submit")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddFossilModal;
