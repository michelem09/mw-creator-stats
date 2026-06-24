const RULES: Array<[string, RegExp]> = [
  ["EDC/Carabiner", /carabiner|edc|paracord|keychain|key clip|bit holder/i],
  ["Flexi/Toy", /flexi|articulated|fidget|squid|kawaii|toothless|kitt|skeleton/i],
  ["Decor/Holiday", /christmas|santa|xmas|halloween|valentine|witch|reindeer|penguin|snowman/i],
  ["Lamp/Light", /lamp|led|flashlight|skadis/i],
  ["Stand/Holder", /stand|holder|tray|hook|clip|mount/i],
  ["Box/Container", /box|case|capsule|container|wallet|organizer|junction/i],
  ["Outdoor/Travel", /tripod|extension cord|umbrella|safetube|aqualock|travel|beach/i],
  ["Tech/Gadget", /vacuum|bird feeder|magsafe|charger|fan|sim holder|camera|gopro|dji|airpods/i],
];

export function classify(title: string): string {
  for (const [name, rx] of RULES) {
    if (rx.test(title)) return name;
  }
  return "Other";
}
