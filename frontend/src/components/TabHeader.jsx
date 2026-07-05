export function TabHeader({ icon: Icon, title, description }) {
  return (
    <div className="flex items-start gap-3 mb-6">
      <div className="bg-purple-600/20 text-purple-400 p-2 rounded-lg">
        <Icon size={22} />
      </div>
      <div>
        <h2 className="text-xl font-bold">{title}</h2>
        {description && <p className="text-gray-400 text-sm">{description}</p>}
      </div>
    </div>
  )
}