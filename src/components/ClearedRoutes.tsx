import React, { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  focusRingClasses,
  focusRingInputClasses,
} from "@/src/styles/focusRing";
import { FiSearch } from "react-icons/fi";

interface ClearedRoutesProps {
  routes: string[];
}

const ROUTE_NUMBER_REGEX = /\broute[\s-]*(\d+)\b/i;

const parseRouteNumber = (value: string): number | null => {
  if (!value) return null;
  const match = ROUTE_NUMBER_REGEX.exec(value.trim());
  if (!match) return null;
  const routeNumber = Number(match[1]);
  return Number.isFinite(routeNumber) ? routeNumber : null;
};

const compareRoutes = (a: string, b: string): number => {
  const aRoute = parseRouteNumber(a);
  const bRoute = parseRouteNumber(b);
  if (aRoute !== null && bRoute !== null) {
    if (aRoute !== bRoute) return aRoute - bRoute;
  }
  const aLower = a.toLowerCase();
  const bLower = b.toLowerCase();
  if (aLower < bLower) return -1;
  if (aLower > bLower) return 1;
  return 0;
};

const ClearedRoutes: React.FC<ClearedRoutesProps> = ({ routes }) => {
  const { t } = useTranslation();
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const searchInputRef = useRef<HTMLInputElement | null>(null);
  const sortedRoutes = useMemo(() => {
    return Array.from(new Set(routes)).sort(compareRoutes);
  }, [routes]);
  const filteredRoutes = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();
    if (!normalizedQuery) return sortedRoutes;
    return sortedRoutes.filter((route) =>
      route.toLowerCase().includes(normalizedQuery),
    );
  }, [searchQuery, sortedRoutes]);

  useEffect(() => {
    if (isSearchOpen) {
      searchInputRef.current?.focus({ preventScroll: true });
      return;
    }
    setSearchQuery("");
  }, [isSearchOpen]);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-300 dark:border-gray-700 overflow-hidden custom-scrollbar">
      <div className="flex items-center gap-2 p-2 bg-gray-800 dark:bg-gray-900">
        <div className="flex-1 min-w-0">
          {isSearchOpen ? (
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Escape") {
                  setIsSearchOpen(false);
                }
              }}
              placeholder={t("common.searchPlaceholder")}
              aria-label={t("common.search")}
              className={`w-full px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-gray-100 ${focusRingInputClasses}`}
            />
          ) : (
            <h2 className="text-center text-white font-press-start text-sm">
              {t("tracker.routes.title")}
            </h2>
          )}
        </div>
        <button
          type="button"
          onClick={() => setIsSearchOpen((prev) => !prev)}
          className={`text-white hover:text-gray-300 rounded-md ${focusRingClasses}`}
          title={isSearchOpen ? t("common.close") : t("common.search")}
          aria-label={isSearchOpen ? t("common.close") : t("common.search")}
        >
          <FiSearch size={18} />
        </button>
      </div>
      <div className="p-4 max-h-60 overflow-y-auto" tabIndex={-1}>
        {filteredRoutes.length > 0 ? (
          <ul className="grid grid-cols-1 gap-2 text-sm text-gray-800 dark:text-gray-200">
            {filteredRoutes.map((r) => (
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
            {searchQuery.trim()
              ? t("modals.common.noMatches")
              : t("tracker.routes.empty")}
          </p>
        )}
      </div>
    </div>
  );
};

export default ClearedRoutes;
