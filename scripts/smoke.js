import { lightCandela } from "../src/remember.js";

const sample = {
  name: "Rosa Elena Vargas",
  relationship: "Abuela",
  years: "1938–2021",
  foods: "pan de muerto\ncafe de olla\nmole negro",
  songs: "Cielito Lindo\nLas Mañanitas",
  stories:
    "She kept a tin of cinnamon by the stove and tapped it twice before coffee.\nEvery November she set out orange marigolds and a glass of water for visitors who could not stay.\nShe taught me to mend a hem by candlelight when the power went out.",
};

const result = await lightCandela(sample);
console.log(JSON.stringify(result, null, 2));
