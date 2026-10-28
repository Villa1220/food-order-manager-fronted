const COUNT_WORDS = [
  "",
  "un",
  "dos",
  "tres",
  "cuatro",
  "cinco",
  "seis",
  "siete",
  "ocho",
  "nueve",
  "diez",
  "once",
  "doce",
  "trece",
  "catorce",
  "quince",
  "dieciséis",
  "diecisiete",
  "dieciocho",
  "diecinueve",
  "veinte",
];

/** Frase de una unidad, ya con artículo, y el plato en plural sin el número. */
const CATALOG: Record<string, { one: string; many: string }> = {
  "1/2 cuy asado": { one: "un medio cuy", many: "medios de cuy" },
  "1/4 cuy asado": { one: "un cuarto de cuy", many: "cuartos de cuy" },
  "cuy entero asado": { one: "un cuy entero", many: "cuyes enteros" },
  borrego: { one: "un borrego", many: "borregos" },
  "camarones al ajillo": { one: "unos camarones al ajillo", many: "camarones al ajillo" },
  churrasco: { one: "un churrasco", many: "churrascos" },
  "corvina frita": { one: "una corvina frita", many: "corvinas fritas" },
  "costillas barbecue": { one: "unas costillas barbecue", many: "costillas barbecue" },
  "costillas bbq": { one: "unas costillas barbecue", many: "costillas barbecue" },
  fritada: { one: "una fritada", many: "fritadas" },
  "menestra con chuleta": { one: "una menestra con chuleta", many: "menestras con chuleta" },
  papipollo: { one: "un papipollo", many: "papipollos" },
  parrillada: { one: "una parrillada", many: "parrilladas" },
  "porcion extra": { one: "una porción extra", many: "porciones extra" },
  salchipapas: { one: "una salchipapa", many: "salchipapas" },
  "tilapia frita": { one: "una tilapia frita", many: "tilapias fritas" },
  "caldo de gallina": { one: "un caldo de gallina", many: "caldos de gallina" },
  "caldo de pata": { one: "un caldo de pata", many: "caldos de pata" },
  "menudo con morcilla de dulce": { one: "un menudo con morcilla de dulce", many: "menudos con morcilla de dulce" },
  yaguarlocro: { one: "un yaguarlocro", many: "yaguarlocros" },
  agua: { one: "un agua", many: "aguas" },
  cerveza: { one: "una cerveza", many: "cervezas" },
  "gaseosa personal": { one: "una gaseosa personal", many: "gaseosas personales" },
  "gaseosa retornable de 2 litros": {
    one: "una gaseosa retornable de dos litros",
    many: "gaseosas retornables de dos litros",
  },
  "gaseosa retornable 2l": {
    one: "una gaseosa retornable de dos litros",
    many: "gaseosas retornables de dos litros",
  },
  guitig: { one: "un Guitig", many: "Guitig" },
  "jarra de chicha de jora": { one: "una jarra de chicha de jora", many: "jarras de chicha de jora" },
  "jarra de guanabana": { one: "una jarra de guanábana", many: "jarras de guanábana" },
  "jarra de limonada": { one: "una jarra de limonada", many: "jarras de limonada" },
  "jarra de mora": { one: "una jarra de mora", many: "jarras de mora" },
  "jugo de mandarina": { one: "un jugo de mandarina", many: "jugos de mandarina" },
  "media jarra": { one: "una media jarra", many: "medias jarras" },
  "vaso 16 oz": { one: "un vaso de dieciséis onzas", many: "vasos de dieciséis onzas" },
  "helado de mandarina": { one: "un helado de mandarina", many: "helados de mandarina" },
  "helados fer": { one: "un helado Fer", many: "helados Fer" },
  "pan de mandarina": { one: "un pan de mandarina", many: "panes de mandarina" },
  "porcion de pastel de mandarina": {
    one: "una porción de pastel de mandarina",
    many: "porciones de pastel de mandarina",
  },
};

function speechKey(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/á/g, "a")
    .replace(/é/g, "e")
    .replace(/í/g, "i")
    .replace(/ó/g, "o")
    .replace(/ú/g, "u")
    .replace(/ü/g, "u")
    .replace(/\s+/g, " ");
}

function numberWord(count: number): string {
  return COUNT_WORDS[count] ?? String(count);
}

const INVARIABLE = new Set(["extra", "barbecue", "bbq", "fer", "guitig"]);

function pluralWord(token: string): string {
  const match = token.match(/^([^A-Za-zÁÉÍÓÚáéíóúÑñ]*)([A-Za-zÁÉÍÓÚáéíóúÑñ]+)(.*)$/);
  if (!match) return token;
  const [, prefix, bare, suffix] = match;
  if (INVARIABLE.has(bare.toLowerCase())) return token;
  if (/\d/.test(token) || bare.length <= 2 || bare === bare.toUpperCase()) return token;
  const lower = bare.toLowerCase();
  if (/(s|x)$/.test(lower) && !/[áéíóú]s$/.test(lower)) return token;
  if (/z$/i.test(bare)) return `${prefix}${bare.slice(0, -1)}${bare.endsWith("Z") ? "CES" : "ces"}${suffix}`;
  if (/y$/i.test(bare) && !/[aeiouáéíóú]y$/i.test(bare)) {
    return `${prefix}${bare.slice(0, -1)}yes${suffix}`;
  }
  if (/[aeiouáéíóú]$/i.test(bare)) return `${prefix}${bare}s${suffix}`;
  const plain = bare
    .replace(/á/g, "a")
    .replace(/é/g, "e")
    .replace(/í/g, "i")
    .replace(/ó/g, "o")
    .replace(/ú/g, "u")
    .replace(/Á/g, "A")
    .replace(/É/g, "E")
    .replace(/Í/g, "I")
    .replace(/Ó/g, "O")
    .replace(/Ú/g, "U");
  return `${prefix}${plain}es${suffix}`;
}

function pluralDish(name: string): string {
  let stopped = false;
  let nounSeen = false;
  return name
    .split(/(\s+)/)
    .map((part) => {
      const plain = part.trim();
      if (!plain) return part;
      const lower = plain.toLowerCase().replace(/[(),.]/g, "");
      if (stopped || plain.startsWith("(") || /^(de|del|con|al|a|en|para|por|y|o|e)$/.test(lower)) {
        stopped = true;
        return part;
      }
      if (/\d/.test(plain)) return part;
      if (!nounSeen) {
        nounSeen = true;
        return pluralWord(part);
      }
      if (/^[a-záéíóúñ]/.test(plain) || INVARIABLE.has(lower)) return pluralWord(part);
      return part;
    })
    .join("");
}

function feminineName(name: string): boolean {
  if (/gaseosa|sopa|fritada|corvina|tilapia|porci[oó]n|costilla|menestra|parrillada|salchipapa|jarra|cerveza/i.test(name)) {
    return true;
  }
  const head = speechKey(name).split(" ")[0] ?? "";
  if (head === "agua" || head === "1/2" || head === "1/4") return false;
  return /a$/.test(head);
}

function genericPhrase(count: number, name: string): string {
  const clean = name.trim().replace(/\s+/g, " ");
  const feminine = feminineName(clean);
  if (count === 1) {
    const head = speechKey(clean).split(" ")[0] ?? "";
    if (/(s|x)$/.test(head) && !/[áéíóú]s$/.test(head)) {
      return `${feminine ? "unas" : "unos"} ${clean.toLowerCase()}`;
    }
    return `${feminine ? "una" : "un"} ${clean.toLowerCase()}`;
  }
  return `${numberWord(count)} ${pluralDish(clean).toLowerCase()}`;
}

/** Cómo debe oírse un plato. Cantidad 1 lleva artículo. De 2 en adelante, número y plural. */
export function dishPhrase(quantity: number, name: string): string {
  const count = Math.max(1, Math.trunc(Number(quantity)) || 1);
  const key = speechKey(name);
  if (key.includes("cuy")) {
    if (/^1\/2\b/.test(key)) return count === 1 ? "un medio cuy" : `${numberWord(count)} medios de cuy`;
    if (/^1\/4\b/.test(key)) return count === 1 ? "un cuarto de cuy" : `${numberWord(count)} cuartos de cuy`;
    if (key.includes("entero")) return count === 1 ? "un cuy entero" : `${numberWord(count)} cuyes enteros`;
  }
  const known = CATALOG[key];
  if (known) return count === 1 ? known.one : `${numberWord(count)} ${known.many}`;
  return genericPhrase(count, name);
}
