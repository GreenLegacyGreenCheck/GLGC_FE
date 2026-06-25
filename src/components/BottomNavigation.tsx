const tabs = [
  { icon: "⌂", label: "홈", active: true },
  { icon: "▤", label: "진단 리포트", active: false },
  { icon: "♙", label: "마이페이지", active: false },
];

export default function BottomNavigation() {
  return (
    <nav
      className="absolute inset-x-4 bottom-4 z-20 rounded-[2rem] bg-white p-2 shadow-xl shadow-emerald-950/12"
      aria-label="하단 메뉴"
    >
      <div className="grid grid-cols-3 gap-2">
        {tabs.map((tab) => (
          <a
            key={tab.label}
            href="#"
            className={`flex min-h-16 flex-col items-center justify-center rounded-[1.5rem] text-sm font-bold ${
              tab.active ? "bg-[#dff1ea] text-[#1ba77d]" : "text-[#8b9290]"
            }`}
            aria-current={tab.active ? "page" : undefined}
          >
            <span className="text-2xl leading-none" aria-hidden="true">
              {tab.icon}
            </span>
            <span className="mt-1">{tab.label}</span>
          </a>
        ))}
      </div>
    </nav>
  );
}
