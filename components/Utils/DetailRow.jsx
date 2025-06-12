function DetailRow({ label, value, valueClassName = '' }) {
  return (
    <div className="flex justify-between text-sm text-gray-700 border-b border-gray-100 pb-2 last:border-b-0">
      <span className="font-medium">{label}</span>
      <span className={valueClassName}>{value}</span>
    </div>
  );
}

export default DetailRow;
