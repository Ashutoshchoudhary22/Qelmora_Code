import {
  BookOpen,
  Headphones,
  HelpCircle,
  Mail,
  MapPin,
  Package,
  ShoppingBag,
  Sparkles,
  Tag,
  User,
} from 'lucide-react';

export const ACCOUNT_TILE_ICON_OPTIONS = [
  { value: 'package', label: 'Package (orders)' },
  { value: 'map-pin', label: 'Map pin (addresses)' },
  { value: 'user', label: 'User (profile)' },
  { value: 'headphones', label: 'Headphones (support)' },
  { value: 'book-open', label: 'Book (story)' },
  { value: 'sparkles', label: 'Sparkles (collections)' },
  { value: 'help-circle', label: 'Help circle' },
  { value: 'mail', label: 'Mail' },
  { value: 'shopping-bag', label: 'Shopping bag' },
  { value: 'tag', label: 'Tag' },
];

const ICON_MAP = {
  package: Package,
  'map-pin': MapPin,
  user: User,
  headphones: Headphones,
  'book-open': BookOpen,
  sparkles: Sparkles,
  'help-circle': HelpCircle,
  mail: Mail,
  'shopping-bag': ShoppingBag,
  tag: Tag,
};

export function accountTileIcon(iconKey) {
  return ICON_MAP[iconKey] || Package;
}