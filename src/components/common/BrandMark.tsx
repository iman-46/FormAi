export function BrandMark({ className = 'w-6 h-6' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 28 28"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <rect
        x="2"
        y="2"
        width="24"
        height="24"
        rx="6"
        className="fill-[#111318] dark:fill-[#4F46E5]"
      />
      <path
        d="M8.5 9.5H19.5M8.5 14H15.5M8.5 18.5H12.5"
        stroke="white"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M17.5 15.5L20 18L17.5 20.5"
        stroke="#A5B4FC"
        strokeWidth="1.9"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
