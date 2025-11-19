import React from 'react';
import { useTranslation } from 'react-i18next';

interface ResetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

const ResetModal: React.FC<ResetModalProps> = ({ isOpen, onClose, onConfirm }) => {
  const { t } = useTranslation();

  if (!isOpen) return null;

  return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold dark:text-gray-100">{t('modals.reset.title')}</h2>
            <button onClick={onClose} className="text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 text-2xl" aria-label={t('common.close')}>
              ×
            </button>
          </div>

          <div className="space-y-3">
            <p className="text-sm text-gray-700 dark:text-gray-300">
              {t('modals.reset.confirmation')}
            </p>
            <div className="p-3 rounded-md border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 text-sm text-red-800 dark:text-red-200">
              {t('modals.reset.description')}
            </div>
          </div>

          <div className="mt-6 flex justify-end gap-3">
            <button onClick={onClose} className="px-4 py-2 rounded-md border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700">
              {t('common.cancel')}
            </button>
            <button onClick={() => onConfirm()} className="px-4 py-2 rounded-md bg-red-600 text-white hover:bg-red-700">
              {t('modals.reset.submit')}
            </button>
          </div>
        </div>
      </div>
  );
};

export default ResetModal;
