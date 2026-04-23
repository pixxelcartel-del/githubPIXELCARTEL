import "server-only";

import type { MarkSchemeItem } from "@/lib/types";

function item(id: string, label: string, marks: number, acceptable: string[], avoidRevealHint: string): MarkSchemeItem {
  return {
    id,
    label,
    marks,
    maxMarks: marks,
    markType: inferMarkType(label),
    acceptable,
    acceptableAlternatives: acceptable,
    avoidRevealHint,
    evidenceHint: avoidRevealHint,
    studentFeedback: `Show clear evidence for: ${label}.`,
  };
}

function inferMarkType(label: string): MarkSchemeItem["markType"] {
  if (/formula|relationship|substitution|method/i.test(label)) {
    return "M";
  }
  if (/answer|reading|speed|mass|force|energy|work|efficiency|resistance|power|voltmeter|ammeter/i.test(label)) {
    return "A";
  }
  if (/explanation|definition|collisions|arrangement|movement|attraction|constant|straight|field/i.test(label)) {
    return "explanation";
  }
  return "B";
}

export const markSchemesBySubQuestion = {
  q1a: [
item("q1a-m1", "Change in momentum", 1, ["18000", "18 000", "change in momentum"], "Read the vertical change over the first 1.5 s before thinking about force."),
            item("q1a-m2", "Force relationship", 1, ["force = change in momentum / time", "F = Δp/t", "F=dp/dt"], "The graph is momentum against time, so the useful operation is a rate of change."),
            item("q1a-m3", "Final force", 1, ["12000", "12 000 N"], "Keep the time interval in seconds and check the final unit is newtons."),
  ],
  q1b: [
item("q1b-m1", "Substitution of p = mv", 1, ["p^2/2m", "m^2v^2/2m"], "Start from momentum as mass times velocity and square it."),
            item("q1b-m2", "Link to kinetic energy", 1, ["1/2 mv^2", "½mv2", "kinetic energy"], "Cancel one mass term and compare the expression to the standard kinetic energy formula."),
            item("q1b-m3", "Momentum at 6.0 s", 1, ["39000", "39 000"], "Use the graph value at exactly 6.0 s, not the end of the graph."),
            item("q1b-m4", "Mass substitution", 1, ["p squared over 2Ek", "39000^2"], "Rearrange the shown equation for mass before substituting."),
            item("q1b-m5", "Mass answer", 1, ["1400", "1.4 × 10^3 kg"], "A car-scale answer should be in the thousands of kilograms, not tens."),
  ],
  q2a: [
item("q2a-m1", "Weight", 1, ["360", "362.6", "37 × 9.8"], "Use the paper's given value for gravitational field strength."),
            item("q2a-m2", "Work formula", 1, ["work = force × distance", "360 × 13"], "The useful transfer is against weight over a vertical distance."),
            item("q2a-m3", "Useful work", 1, ["4700", "4.7 × 10^3"], "Round sensibly after multiplying the weight by the height."),
  ],
  q2b: [
item("q2b-m1", "Electrical energy formula", 1, ["VIt", "230 × 5.6 × 11"], "For energy from a power supply, combine potential difference, current and time."),
            item("q2b-m2", "Input energy", 1, ["1.4 × 10^4", "14000"], "Check the answer is larger than the useful output energy."),
            item("q2b-m3", "Efficiency", 1, ["0.33", "33%"], "Efficiency compares useful output with total input."),
  ],
  q2c: [
item("q2c-m1", "Other useful load", 1, ["lift the cage", "lift cable"], "Think about what else moves upward besides the boxes."),
            item("q2c-m2", "Dissipation", 1, ["thermal energy in motor", "friction", "air resistance"], "Name a route where energy is spread to the surroundings."),
  ],
  q3a: [
item("q3a-m1", "Collisions", 1, ["water molecules collide with ice molecules"], "Use the word collision and keep direction from warmer water to colder ice."),
            item("q3a-m2", "Energy gain in ice", 1, ["ice molecules vibrate faster", "bonds are broken", "forces overcome"], "Say what changes for particles in the solid after receiving energy."),
  ],
  q3b: [
item("q3b-m1", "Thermal energy substitution", 1, ["mcΔθ", "0.24 × 4200 × 16"], "Use the change in temperature, not the final temperature alone."),
            item("q3b-m2", "Energy answer", 1, ["1.6 × 10^4", "16000"], "The answer should be in joules and around ten thousand."),
            item("q3b-m3", "Liquid arrangement", 1, ["no orderly arrangement", "not fixed pattern"], "Compare a liquid with a crystalline solid."),
            item("q3b-m4", "Liquid movement", 1, ["slide over each other", "move within volume", "close together"], "Mention freedom to move and closeness if you can."),
            item("q3b-m5", "Plastic insulation", 1, ["bad thermal conductor", "good insulator", "no delocalised electrons"], "Link the material to reduced thermal transfer."),
  ],
  q4a: [
item("q4a-m1", "Speed or medium change", 1, ["light travels more slowly", "different refractive index", "denser medium"], "Name what changes about the wave as it enters glass."),
          item("q4a-m2", "Non-normal incidence", 1, ["angle of incidence greater than zero", "wavelength changes"], "A ray entering along the normal would not bend; use that contrast."),
  ],
  q4b: [
item("q4b-m1", "Principal focus base definition", 1, ["where parallel rays meet"], "Start with parallel rays after refraction."),
          item("q4b-m2", "Principal axis precision", 1, ["parallel to principal axis", "paraxial rays"], "Make the rays specific enough for a lens definition."),
          item("q4b-m3", "Focal length", 1, ["distance between principal focus and centre of lens"], "It is a distance from a focus to a named point on the lens."),
  ],
  q4c: [
item("q4c-m1", "Object placement", 1, ["arrow height 1.8 cm", "left of centre"], "Check object arrow size and side before tracing rays."),
          item("q4c-m2", "Construction rays", 2, ["ray through centre", "ray to focus", "parallel then focus"], "Use two standard rays from the tip of the object."),
          item("q4c-m3", "Image tracing", 1, ["rays traced back", "image labelled I"], "For a virtual image, extend the rays backward to where they seem to meet."),
          item("q4c-m4", "Virtual explanation", 1, ["rays seem to come from image", "do not pass through image", "upright"], "Explain virtual using ray paths, not just a memorised label."),
  ],
  q5a: [
item("q5a-m1", "High energy particles leave", 1, ["fastest particles escape", "higher kinetic energy particles escape"], "Focus on which particles leave the liquid surface."),
          item("q5a-m2", "Average kinetic energy falls", 1, ["average kinetic energy decreases", "internal energy decreases"], "Temperature follows the average kinetic energy of particles left behind."),
  ],
  q5b: [
item("q5b-m1", "Changing magnetic field", 2, ["magnetic field of coil", "alternating magnetic field", "changing magnetic field"], "Mention the coil's field and why a.c. matters."),
          item("q5b-m2", "Induced e.m.f.", 1, ["e.m.f. induced", "induced current"], "Use the induction word connected to the metal container."),
          item("q5b-m3", "Particle speed and spacing", 2, ["speed increases", "particles push apart", "volume increases"], "Explain expansion using particle motion, not simply 'gets bigger'."),
          item("q5b-m4", "Convection movement", 2, ["less dense heated liquid rises", "cooler denser liquid sinks", "convection current"], "Density difference is the bridge between heating and circulation."),
  ],
  q6a: [
item("q6a-m1", "Proportional relationship", 1, ["potential difference directly proportional to current"], "Name the two quantities and the proportional relationship."),
          item("q6a-m2", "Constant temperature", 1, ["constant temperature", "constant physical conditions"], "The law needs a condition; include it explicitly."),
  ],
  q6b: [
item("q6b-m1", "Current substitution", 1, ["9.0/(8.0+4.0)", "V/R"], "Find the total series resistance before current."),
          item("q6b-m2", "Ammeter reading", 1, ["0.75 A", "0.75"], "Series current is the same through both resistors."),
          item("q6b-m3", "Power substitution", 1, ["0.75 × 6.0", "I V", "I^2 R"], "Use the potential difference across P, not the whole battery, unless using I squared R."),
          item("q6b-m4", "Power answer", 1, ["4.5 W", "4.5"], "The unit should be watts."),
  ],
  q6c: [
item("q6c-m1", "Geometry effect", 1, ["length halves and area doubles", "8.0 × 0.5 / 2"], "Resistance changes with length and cross-sectional area in opposite directions."),
          item("q6c-m2", "New resistance", 1, ["2.0 Ω", "2.0"], "Halving length and doubling area makes the resistance one quarter."),
          item("q6c-m3", "Potential divider/current", 1, ["9.0 × 4/(2+4)", "1.5 A"], "Recalculate the series current or use the fixed resistor ratio."),
          item("q6c-m4", "Voltmeter reading", 1, ["6.0 V", "6.0"], "The voltmeter is across the 4.0 ohm resistor."),
  ],
  q7a: [
item("q7a-m1", "Electrons named", 1, ["electrons", "negative charge"], "Only one type of charged particle moves in this context."),
          item("q7a-m2", "Direction of movement", 1, ["electrons move from cloth to rod"], "A rod becoming negative must gain electrons."),
  ],
  q7b: [
item("q7b-m1", "Free electrons in conductor", 1, ["electrons are free to move"], "State what makes a conductor different from an insulator."),
          item("q7b-m2", "Like charges repel", 1, ["like charges repel"], "Use the rule that explains why electrons shift away."),
          item("q7b-m3", "Charge separation", 2, ["electrons move away from rod", "left side becomes positive", "protons do not move"], "Separate what moves from what stays fixed."),
          item("q7b-m4", "Attraction", 2, ["unlike charges attract", "attractive force stronger", "positive charge closer"], "Compare the nearer attraction with the farther repulsion."),
  ],
  q8a: [
item("q8a-m1", "Different neutron number", 1, ["different number of neutrons", "different nucleons"], "Same element means same proton number; focus on what changes."),
          item("q8a-m2", "Specific neutron comparison", 1, ["222 has two fewer neutrons", "136 and 138 neutrons"], "Subtract the proton number from each mass number."),
  ],
  q8b: [
item("q8b-m1", "Alpha particle notation", 1, ["4 2 α", "4/2 alpha"], "An alpha particle is a helium nucleus."),
          item("q8b-m2", "Daughter mass number", 1, ["218"], "Alpha emission reduces mass number by four."),
          item("q8b-m3", "Daughter proton number/element", 1, ["84", "Po", "polonium"], "Alpha emission reduces proton number by two."),
  ],
  q8c: [
item("q8c-m1", "Scattered alpha evidence", 1, ["deflected through large angles", "detector J not zero"], "Use the rare large deflections as evidence."),
          item("q8c-m2", "Most pass straight", 1, ["most pass straight through", "detector K larger"], "Use the common undeflected paths as the second observation."),
          item("q8c-m3", "Charge concentration", 1, ["concentration of charge", "positive nucleus"], "The deflections need a concentrated charged region."),
          item("q8c-m4", "Dense tiny nucleus/empty space", 1, ["most mass in small volume", "dense nucleus", "mostly empty space"], "Combine the two observations into atom structure."),
  ],
  q9a: [
item("q9a-m1", "Constant speed", 1, ["speed is constant"], "No resultant force means no change in speed."),
          item("q9a-m2", "Straight line", 1, ["straight line", "constant direction"], "No resultant force also means no change in direction."),
  ],
  q9b: [
item("q9b-m1", "Force changes direction", 1, ["change direction of motion", "otherwise move straight"], "Circular motion needs a changing velocity direction."),
          item("q9b-m2", "Gravitational field of Sun", 2, ["gravity", "gravitational field of Sun", "towards Sun"], "Name the field and the body producing it."),
          item("q9b-m3", "Orbital speed substitution", 1, ["2πr/T", "2π × 1.1 × 10^11"], "Use circumference divided by period, converting hours to seconds."),
          item("q9b-m4", "Speed answer", 1, ["3.6 × 10^4", "36000"], "The expected unit is metres per second."),
          item("q9b-m5", "Comparison with Mercury", 1, ["Mercury", "speed greater than Venus"], "Use the planet with the greater orbital speed in the table."),
  ],
} satisfies Record<string, MarkSchemeItem[]>;

export function getMarkScheme(subQuestionId: string) {
  return markSchemesBySubQuestion[subQuestionId as keyof typeof markSchemesBySubQuestion] ?? [];
}

export function getMarkSchemeGuardrails(subQuestionId: string) {
  return getMarkScheme(subQuestionId).map((item) => item.avoidRevealHint);
}
