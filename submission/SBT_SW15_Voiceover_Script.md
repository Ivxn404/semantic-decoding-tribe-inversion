# Voiceover script, SBT_SW15 video (87.7 s)

Read each part in the time shown. Spoken numbers are written as they should be said.

**Title** (0.9–12.5 s, about 12 s)

Can a brain model that predicts f M R I almost perfectly be run backwards, to read meaning out of the brain? Project S B T, S W fifteen tests this on Meta's TRIBE v2.

**The problem** (13.3–23.1 s, about 10 s)

Encoding models predict brain activity from what a person hears and sees. Decoding is assumed to follow, but for a deep foundation encoder this had never been tested.

**The method** (23.9–35.2 s, about 11 s)

The frozen network, a hundred and seventy seven million parameters, is re-entered after feature aggregation, and the stimulus is recovered by gradient descent, against a known ground truth.

**Working model (live inversion)** (36.0–44.8 s, about 9 s)

In the working model, the prediction error falls more than three hundred thousand fold. Yet recovery stalls, and equally good fits from different starts disagree.

**Working model on the real TRIBE v2** (45.6–52.8 s, about 7 s)

On the real model, the brain-wide fit reaches an R squared of zero point nine nine five, while recovery stops near one half.

**Key results** (53.6–64.0 s, about 10 s)

Across four ground truths, error falls twenty eight fold while recovery saturates. Between equal solutions the error rises almost five fold: the inverse is non-convex.

**Regions and real fMRI** (64.8–79.5 s, about 15 s)

The most responsive network, visual cortex, is the hardest to decode from. On real f M R I, four of five story segments are identified among forty five, yet reconstruction reaches a cosine of only zero point zero two.

**Take-away** (80.3–85.3 s, about 5 s)

Encoding accuracy does not certify decoding. Recoverability has to be measured.
