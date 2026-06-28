export const places = [
  {
    id: 'place-1',
    name: 'Nuestra Cafetería Favorita',
    mapsUrl: 'https://maps.google.com/?q=cafe',
    memoriesCount: 3,
    coverColor: '#00d2ff',
    lat: 19.432608,
    lng: -99.133209
  },
  {
    id: 'place-2',
    name: 'Spot de Ramen Oculto',
    mapsUrl: 'https://maps.google.com/?q=ramen',
    memoriesCount: 5,
    coverColor: '#00ff87',
    lat: 19.419444,
    lng: -99.159444
  },
  {
    id: 'place-3',
    name: 'Parque de las Luces',
    mapsUrl: 'https://maps.google.com/?q=park',
    memoriesCount: 1,
    coverColor: '#3a7bd5',
    lat: 19.421526,
    lng: -99.182285
  },
  {
    id: 'place-4',
    name: 'El Tianguis de Ropa',
    mapsUrl: 'https://maps.google.com/?q=tianguis',
    memoriesCount: 2,
    coverColor: '#00e08f',
    lat: 19.444211,
    lng: -99.141544
  }
];

export const memories = [
  {
    id: 'mem-1',
    placeId: 'place-1',
    date: '2025-10-14',
    image: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?q=80&w=800&auto=format&fit=crop',
    palette: ['#E6A8D7', '#884D80', '#FFFFFF', '#333333'],
    tags: ['Y2K', 'Oversized', 'Rosa'],
    note: 'El matcha latte estaba riquísimo. Tu outfit resaltaba perfecto con la luz del atardecer. 🎀✨'
  },
  {
    id: 'mem-2',
    placeId: 'place-1',
    date: '2025-08-02',
    image: 'https://images.unsplash.com/photo-1555529902-5261145633bf?q=80&w=800&auto=format&fit=crop',
    palette: ['#C4A484', '#654321', '#1A1A1A', '#F5F5DC'],
    tags: ['Cozy', 'Trench', 'Otoño'],
    note: 'Hacía mucho frío ese día pero nuestro spot siempre se siente cálido. Pedimos nuestro pan francés de siempre. ☕'
  },
  {
    id: 'mem-3',
    placeId: 'place-2',
    date: '2025-11-20',
    image: 'https://images.unsplash.com/photo-1557872943-16a5ac26437e?q=80&w=800&auto=format&fit=crop',
    palette: ['#FF0000', '#000000', '#F2F2F2', '#EEDC82'],
    tags: ['Gótico', 'Cuero', 'Dark'],
    note: 'Descubrimos este lugar por error, pero el ramen picante fue un 10/10. El vibe cyberpunk de la entrada quedó perfecto para las fotos. 🍜🖤'
  }
];
