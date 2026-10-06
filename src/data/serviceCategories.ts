export interface ServiceCategory {
  id: string
  name: string
  emoji: string
  description: string
  gradient: string
}

export const serviceCategories: ServiceCategory[] = [
  { id: 'plumber', name: 'Plumber', emoji: '🚰', description: 'Pipe, tap & water problems', gradient: 'from-blue-400 to-cyan-400' },
  { id: 'electrician', name: 'Electrician', emoji: '⚡', description: 'Wiring, switches & electricity', gradient: 'from-amber-400 to-yellow-400' },
  { id: 'ac', name: 'AC / HVAC', emoji: '❄️', description: 'Cooling & AC repair', gradient: 'from-sky-400 to-indigo-400' },
  { id: 'car', name: 'Car Workshop', emoji: '🚗', description: 'Car repair & maintenance', gradient: 'from-rose-400 to-red-400' },
  { id: 'bike', name: 'Bike Mechanic', emoji: '🏍️', description: 'Motorbike service & repair', gradient: 'from-slate-500 to-slate-700' },
  { id: 'cleaning', name: 'Cleaning', emoji: '🧹', description: 'Home & office cleaning', gradient: 'from-teal-400 to-emerald-400' },
  { id: 'carpenter', name: 'Carpenter', emoji: '🔨', description: 'Furniture & woodwork', gradient: 'from-orange-400 to-amber-500' },
  { id: 'solar', name: 'Solar', emoji: '☀️', description: 'Solar panel installation & repair', gradient: 'from-yellow-400 to-orange-400' },
  { id: 'appliance', name: 'Appliance Repair', emoji: '🧺', description: 'Washing machine, fridge & more', gradient: 'from-violet-400 to-purple-400' },
  { id: 'painter', name: 'Painter', emoji: '🎨', description: 'Interior & exterior painting', gradient: 'from-pink-400 to-fuchsia-400' },
  { id: 'pest', name: 'Pest Control', emoji: '🐜', description: 'Insect & rodent control', gradient: 'from-lime-500 to-green-500' },
  { id: 'general', name: 'General Maintenance', emoji: '🔧', description: 'Handyman for everything else', gradient: 'from-gray-400 to-gray-600' },
]
