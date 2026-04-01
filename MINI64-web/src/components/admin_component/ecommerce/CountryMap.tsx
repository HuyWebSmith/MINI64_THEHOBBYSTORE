interface CountryMapProps {
  mapColor?: string;
}

const CountryMap = ({ mapColor = "#D0D5DD" }: CountryMapProps) => {
  const regions = [
    { name: "North America", x: "8%", y: "24%", w: "24%", h: "30%" },
    { name: "South America", x: "24%", y: "58%", w: "14%", h: "24%" },
    { name: "Europe", x: "44%", y: "20%", w: "14%", h: "18%" },
    { name: "Africa", x: "46%", y: "44%", w: "16%", h: "28%" },
    { name: "Asia", x: "60%", y: "24%", w: "28%", h: "32%" },
    { name: "Australia", x: "78%", y: "68%", w: "12%", h: "14%" },
  ];

  const markers = [
    { name: "USA", left: "18%", top: "34%" },
    { name: "India", left: "68%", top: "46%" },
    { name: "United Kingdom", left: "49%", top: "26%" },
    { name: "Sweden", left: "53%", top: "19%" },
  ];

  return (
    <div className="relative h-full w-full overflow-hidden rounded-2xl bg-gradient-to-br from-white to-slate-100 dark:from-gray-900 dark:to-gray-800">
      <div className="absolute inset-0 opacity-40">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(70,95,255,0.18),transparent_45%)]" />
      </div>
      {regions.map((region) => (
        <div
          key={region.name}
          className="absolute rounded-full border border-white/80 shadow-sm dark:border-white/10"
          style={{
            left: region.x,
            top: region.y,
            width: region.w,
            height: region.h,
            backgroundColor: mapColor,
          }}
          title={region.name}
        />
      ))}
      {markers.map((marker) => (
        <div
          key={marker.name}
          className="absolute z-10"
          style={{ left: marker.left, top: marker.top }}
          title={marker.name}
        >
          <span className="block h-3 w-3 rounded-full bg-brand-500 ring-4 ring-brand-500/20" />
        </div>
      ))}
    </div>
  );
};

export default CountryMap;
