import React from "react";
import { useTranslation } from "react-i18next";

interface ClearedRoutesProps {
  routes: string[];
}

const ClearedRoutes: React.FC<ClearedRoutesProps> = ({ routes }) => {
  const hasRoutes = routes && routes.length > 0;
  const { t } = useTranslation();

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-300 dark:border-gray-700 overflow-hidden custom-scrollbar">
      <div className="flex justify-center items-center p-2 bg-gray-800 dark:bg-gray-900">
        <h2 className="text-center text-white font-press-start text-sm">
          {t("tracker.routes.title")}
        </h2>
      </div>
      <div className="p-4 max-h-60 overflow-y-auto">
        {hasRoutes ? (
          <ul className="grid grid-cols-1 gap-2 text-sm text-gray-800 dark:text-gray-200">
            {routes.map((r) => (
              <li
                key={r}
                className="px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-md"
              >
                {r}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-center text-gray-500 dark:text-gray-400 text-sm py-4">
            {t("tracker.routes.empty")}
          </p>
        )}
      </div>
    </div>
  );
};

export default ClearedRoutes;
