import { ALL_SUGGESTIONS } from '../constants/data';
import { C } from '../constants/colors';

export function getPersonalizedSuggestions(profile, safetyAnswers) {
  const year = parseInt(profile?.yearBuilt) || 0;
  const type = (profile?.homeType || '').toLowerCase().replace(/\s*\/\s*/g, ' ').replace(/\s+/g, '');

  const typeKey = type.includes('condo') || type.includes('apartment') ? 'condo'
    : type.includes('townhouse') ? 'townhouse'
    : type.includes('multi') ? 'multifamily'
    : 'singlefamily';

  const now = new Date().getFullYear();
  const age = year > 0 ? now - year : 0;

  const filtered = ALL_SUGGESTIONS.filter(s => {
    if (s.tags.includes('all')) return true;
    if (s.tags.includes(typeKey)) return true;
    return false;
  }).filter(s => {
    if (s.minYear === 0) return true;
    if (year > 0 && year <= s.minYear) return true;
    return false;
  });

  const boosted = filtered.map(s => {
    let boost = 0;
    if (s.project.toLowerCase().includes('insulation') && age > 30) boost += 15;
    if (s.project.toLowerCase().includes('window') && age > 25) boost += 10;
    if (s.project.toLowerCase().includes('electrical') && age > 40) boost += 20;
    if (s.project.toLowerCase().includes('hvac') && age > 15) boost += 10;
    if (s.project.toLowerCase().includes('roof') && age > 20) boost += 10;
    return { ...s, roi: s.roi + boost };
  });

  return boosted.sort((a, b) => b.roi - a.roi).slice(0, 10);
}

export function getRoiColor(roi) {
  if (roi >= 100) return C.green;
  if (roi >= 75)  return C.accent2;
  if (roi >= 50)  return C.yellow;
  return C.red;
}

export async function resizeImageToBase64(file, maxPx = 1400) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      let { width, height } = img;
      if (width > maxPx || height > maxPx) {
        if (width > height) { height = Math.round(height * maxPx / width); width = maxPx; }
        else { width = Math.round(width * maxPx / height); height = maxPx; }
      }
      const canvas = document.createElement('canvas');
      canvas.width = width; canvas.height = height;
      canvas.getContext('2d').drawImage(img, 0, 0, width, height);
      URL.revokeObjectURL(url);
      const b64 = canvas.toDataURL('image/jpeg', 0.85).split(',')[1];
      resolve(b64);
    };
    img.onerror = reject;
    img.src = url;
  });
}
