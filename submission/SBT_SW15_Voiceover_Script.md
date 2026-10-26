# Voiceover script, SBT_SW15 video (84 s)

Read at a calm, even pace. Leave a short breath between lines; a slightly longer pause between scenes is fine, since the video re-times itself to your recording.

**Changed since the first version:** only the real-model line now says "an R squared of about zero point nine nine" (it matches the number on screen).

## Title

- Can a brain model that predicts f M R I almost perfectly be run backwards,
- to read meaning out of the brain?
- Project S B T, S W fifteen tests this on Meta's TRIBE v2.

## The problem

- Encoding models predict brain activity from what a person hears and sees.
- Decoding is assumed to follow,
- but for a deep foundation encoder, this had never been tested.

## The method

- The frozen network, a hundred and seventy seven million parameters,
- is re-entered after feature aggregation,
- and the stimulus is recovered by gradient descent,
- against a known ground truth.

## Working model (live inversion)

- In the working model, the prediction error falls more than three hundred thousand fold.
- Yet recovery stalls,
- and equally good fits from different starts disagree.

## Working model on the real TRIBE v2

- On the real model, the brain-wide fit reaches an R squared of about zero point nine nine,
- while recovery stops near one half.

## Key results

- Across four ground truths, error falls twenty eight fold while recovery saturates.
- Between equal solutions, the error rises almost five fold:
- the inverse is non-convex.

## Regions and real fMRI

- The most responsive network, visual cortex, is the hardest to decode from.
- On real f M R I, four of five story segments are identified among forty five,
- yet reconstruction reaches a cosine of only zero point zero two.

## Take-away

- Encoding accuracy does not certify decoding.
- Recoverability has to be measured.

Record in one take or line by line (phone voice memo is fine), in a quiet room, phone about 20 cm away.