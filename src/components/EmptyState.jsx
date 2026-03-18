export default function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-4 text-center">
      {Icon && (
        <div className="w-14 h-14 rounded-2xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-center">
          <Icon size={24} className="text-white/20" />
        </div>
      )}
      <div>
        <p className="font-semibold text-white/50">{title}</p>
        {description && <p className="text-sm text-white/30 mt-1">{description}</p>}
      </div>
      {action}
    </div>
  )
}
