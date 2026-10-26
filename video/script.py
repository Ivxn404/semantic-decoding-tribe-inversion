# Narration for the 90-second Review III video. Each entry: (scene id, spoken text, on-screen caption).
# Spoken text is written for the voice (numbers and acronyms spelled the way they should be said).
SCENES = [
    ("title",
     "Can a brain model that predicts f M R I almost perfectly be run backwards, to read meaning out of the brain? "
     "Project S B T, S W fifteen tests this on Meta's TRIBE v2.",
     "Can an accurate brain encoder be inverted?"),
    ("problem",
     "Encoding models predict brain activity from what a person hears and sees. "
     "Decoding is assumed to follow, but for a deep foundation encoder this had never been tested.",
     "Encoding is accurate. Is decoding?"),
    ("method",
     "The frozen network, a hundred and seventy seven million parameters, is re-entered after feature aggregation, "
     "and the stimulus is recovered by gradient descent, against a known ground truth.",
     "Inversion through the frozen network"),
    ("lab",
     "In the working model, the prediction error falls more than three hundred thousand fold. "
     "Yet recovery stalls, and equally good fits from different starts disagree.",
     "Working model: a better fit, not a better answer"),
    ("real",
     "On the real model, the brain-wide fit reaches an R squared of zero point nine nine five, "
     "while recovery stops near one half.",
     "The same experiment on TRIBE v2"),
    ("results1",
     "Across four ground truths, error falls twenty eight fold while recovery saturates. "
     "Between equal solutions the error rises almost five fold: the inverse is non-convex.",
     "Key results"),
    ("results2",
     "The most responsive network, visual cortex, is the hardest to decode from. "
     "On real f M R I, four of five story segments are identified among forty five, "
     "yet reconstruction reaches a cosine of only zero point zero two.",
     "Regions and real fMRI"),
    ("close",
     "Encoding accuracy does not certify decoding. Recoverability has to be measured.",
     "Recoverability has to be measured"),
]
