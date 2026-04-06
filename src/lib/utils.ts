import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const getDistrictKey = (district: string) => {
  const map: Record<string, string> = {
    "Samarqand shahar": "samarkand_city",
    "Urgut": "urgut",
    "Kattaqoʻrgʻon": "kattaqorgon",
    "Pastdargʻom": "pastdargom",
    "Payariq": "payariq",
    "Ishtixon": "ishtixon",
    "Narpay": "narpay",
    "Toyloq": "toyloq",
    "Qoʻshrabot": "qoshrabot",
    "Bulungʻur": "bulungur",
    "Jomboy": "jomboy"
  };
  return map[district] || district.toLowerCase().replace(/ʻ/g, '').replace(/ /g, '_');
};
