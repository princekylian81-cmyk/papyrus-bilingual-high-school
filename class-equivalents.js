window.formatPapyrusClass = function (className) {
  const equivalents = {
    '6e': 'Sixième',
    'Form I': 'Sixième',
    'Form II': 'Cinquième',
    'Form III': 'Quatrième',
    'Form IV': 'Troisième',
    'Form V': 'Seconde',
    'Lower Sixth': 'Première',
    'Upper Sixth': 'Terminale'
  };
  const equivalent = Object.prototype.hasOwnProperty.call(equivalents, className)
    ? equivalents[className]
    : '';
  return equivalent ? `${className} · ${equivalent}` : className || '—';
};
