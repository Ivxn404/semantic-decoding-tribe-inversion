# Narration for the Review III video, split into phrases. Each phrase is synthesised separately so its
# start time is known exactly: visuals are cued to phrases, and captions are built from them.
# Each phrase: (spoken text, caption text). Spoken text spells numbers and acronyms the way they are said.
SCENES = [
    ("title", [
        ("Can a brain model that predicts f M R I almost perfectly be run backwards,", "Can a brain model that predicts fMRI almost perfectly be run backwards,"),
        ("to read meaning out of the brain?", "to read meaning out of the brain?"),
        ("Project S B T, S W fifteen tests this on Meta's TRIBE v2.", "Project SBT_SW15 tests this on Meta's TRIBE v2."),
    ]),
    ("problem", [
        ("Encoding models predict brain activity from what a person hears and sees.", "Encoding models predict brain activity from what a person hears and sees."),
        ("Decoding is assumed to follow,", "Decoding is assumed to follow,"),
        ("but for a deep foundation encoder, this had never been tested.", "but for a deep foundation encoder, this had never been tested."),
    ]),
    ("method", [
        ("The frozen network, a hundred and seventy seven million parameters,", "The frozen network, 177 million parameters,"),
        ("is re-entered after feature aggregation,", "is re-entered after feature aggregation,"),
        ("and the stimulus is recovered by gradient descent,", "and the stimulus is recovered by gradient descent,"),
        ("against a known ground truth.", "against a known ground truth."),
    ]),
    ("lab", [
        ("In the working model, the prediction error falls more than three hundred thousand fold.", "In the working model, the prediction error falls more than 300,000-fold."),
        ("Yet recovery stalls,", "Yet recovery stalls,"),
        ("and equally good fits from different starts disagree.", "and equally good fits from different starts disagree."),
    ]),
    ("real", [
        ("On the real model, the brain-wide fit reaches an R squared of about zero point nine nine,", "On the real model, the brain-wide fit reaches R² ≈ 0.99,"),
        ("while recovery stops near one half.", "while recovery stops near one half."),
    ]),
    ("results1", [
        ("Across four ground truths, error falls twenty eight fold while recovery saturates.", "Across four ground truths, error falls 28-fold while recovery saturates."),
        ("Between equal solutions, the error rises almost five fold:", "Between equal solutions, the error rises almost 5-fold:"),
        ("the inverse is non-convex.", "the inverse is non-convex."),
    ]),
    ("results2", [
        ("The most responsive network, visual cortex, is the hardest to decode from.", "The most responsive network, visual cortex, is the hardest to decode from."),
        ("On real f M R I, four of five story segments are identified among forty five,", "On real fMRI, 4 of 5 story segments are identified among 45,"),
        ("yet reconstruction reaches a cosine of only zero point zero two.", "yet reconstruction reaches a cosine of only 0.02."),
    ]),
    ("close", [
        ("Encoding accuracy does not certify decoding.", "Encoding accuracy does not certify decoding."),
        ("Recoverability has to be measured.", "Recoverability has to be measured."),
    ]),
]
