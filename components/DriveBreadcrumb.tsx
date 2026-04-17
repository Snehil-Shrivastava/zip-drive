"use client";

interface BreadcrumbEntry {
  id: string;
  name: string;
}

interface DriveBreadcrumbProps {
  trail: BreadcrumbEntry[];
  onNavigate: (index: number) => void;
}

const ChevronIcon = () => (
  <svg
    width="10"
    height="10"
    viewBox="0 0 10 10"
    fill="none"
    className="text-white/20 shrink-0"
  >
    <path
      d="M3 2l3 3-3 3"
      stroke="currentColor"
      strokeWidth="1.3"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const DriveBreadcrumb = ({ trail, onNavigate }: DriveBreadcrumbProps) => {
  if (trail.length <= 1) return null;

  return (
    <div className="flex items-center gap-1.5 flex-wrap mb-5 h-6">
      {trail.map((entry, index) => {
        const isLast = index === trail.length - 1;
        return (
          <div key={entry.id} className="flex items-center gap-1.5">
            {index > 0 && <ChevronIcon />}
            <button
              onClick={() => onNavigate(index)}
              disabled={isLast}
              className={`text-xs px-2 py-1 rounded-md transition-colors ${
                isLast
                  ? "text-white/70 cursor-default"
                  : "text-white/40 hover:text-white/70 hover:bg-white/5 cursor-pointer"
              }`}
            >
              {entry.name}
            </button>
          </div>
        );
      })}
    </div>
  );
};

export default DriveBreadcrumb;
export type { BreadcrumbEntry };
