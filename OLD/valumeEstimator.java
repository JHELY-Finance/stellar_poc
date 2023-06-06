package pl.nethuns.main;

/**
 *
 * @author pnycz
 */


import static java.lang.Math.max;
import static java.lang.Math.abs;
import static java.lang.Math.log;
import static java.lang.Math.min;
import static java.lang.Math.sqrt;
import pl.nethuns.main.ArbitrageMatrix;
import pl.nethuns.model.ArbitrageCandidate;

/**
 *
 * @author Piotr
 */
public class volumeEstimator {

    private static class VolumeAndPrice {

        double outVolume;
        double inVolume;
        double price;

        public VolumeAndPrice() {
            this(-1, -1);
        }

        public VolumeAndPrice(final double volume) {
            this(volume, -1);
        }

        public VolumeAndPrice(final double volume, final double price) {
            this.outVolume = volume;
            this.price = price;
        }

        public double GetOutVolume() {
            return outVolume;
        }

        public double GetInVolume() {
            return inVolume;
        }

        public double GetPrice() {
            return price;
        }

        public void SetOutVolume(double volume) {
            this.outVolume = volume;
        }

        public void SetInVolume(double volume) {
            this.inVolume = volume;
        }

        public void SetPrice(double price) {
            this.price = price;
        }
    };

    private static ArbitrageMatrix matrix = null;

    public static void SetMatrix(ArbitrageMatrix matrix) {
        volumeEstimator.matrix = matrix;
    }

    static private double GetWeightedPrice(final double volume, int x, int y) {

        double totalVolume = 0;
        double totalScalar = 0;

        for (int i = 0; (i < matrix.getBookSize(x, y)) && ((totalVolume - volume) < 0); i++) {
            double bookVolume = matrix.getOrderVolume(x, y, i);
            double bookPrice = matrix.getOrderPrice(x, y, i);
            double finalVolume = min(bookVolume, volume - totalVolume);
            totalScalar += finalVolume * bookPrice;
            totalVolume += finalVolume;
        }

        if ((totalVolume - volume) < 0) {
            return Double.NaN;
        }

        double result = totalScalar / totalVolume;
        return result;
    }

    private static VolumeAndPrice GetWeightedPriceReverse(VolumeAndPrice result, final double outVolume, int x, int y) {

        if (result == null) {
            throw new RuntimeException("Null pointer Exception:GetWeightedPriceReversed()");
        }

        double inVolume = 0;
        double totalScalar = 0;

        for (int i = 0; (i < matrix.getBookSize(x, y)) && ((totalScalar - outVolume) < 0); i++) {
            double bookVolume = matrix.getOrderVolume(x, y, i);
            double bookPrice = matrix.getOrderPrice(x, y, i);

            /* bookVolume is expressed as "x", therefore conversion of "volume - totalScalar" from "y" to "x" is neccessary */
            double tmpVolume = (outVolume - totalScalar) / bookPrice;
            final double finalVolume = min(bookVolume, tmpVolume);
            totalScalar += finalVolume * bookPrice;
            inVolume += finalVolume;
        }

        final double resultPrice = totalScalar / inVolume;
        final double resultOutVolume = totalScalar;

        result.SetPrice(resultPrice);
        result.SetOutVolume(resultOutVolume);
        result.SetInVolume(inVolume);
        return result;
    }

    /*
        Assumption is - volume is expressed as input (output) currency.
     */
    static private double getPathProfitOld(double outputVolume, ArbitrageCandidate candidate) {

        int stepCount = candidate.getPathLength();
        stepCount = stepCount - 1;

        int x = CandidateGetSrc(stepCount, candidate);
        int y = CandidateGetDst(stepCount, candidate);

        /* Initial value calculation */
        VolumeAndPrice volumeAndPrice = new VolumeAndPrice();

        /* calculates price per unit, considers the available volume at "x,y"*/
        volumeAndPrice = GetWeightedPriceReverse(volumeAndPrice, outputVolume, x, y);

        double feeRate = matrix.getFee(x, y);

        /* result.GetVolume() returns volume as "y" value */
        double maxVolume = volumeAndPrice.GetOutVolume();
        outputVolume = maxVolume;
        final double feeAmount = maxVolume * feeRate;

        /*
        now maxVolume contains amount which takes into account 
        the order book content, and it is reduced by commission
         */
        maxVolume = maxVolume - feeAmount;
        outputVolume = outputVolume - feeAmount;

        while (true) {

            double price = volumeAndPrice.GetPrice();
            double estimatedVolume = maxVolume / (price * (1 - feeRate));

            double bookVolume = matrix.GetTotalVolume(x, y);
            maxVolume = min(bookVolume, estimatedVolume);

            stepCount--;

            if (stepCount < 0) {
                break;
            }

            x = CandidateGetSrc(stepCount, candidate);
            y = CandidateGetDst(stepCount, candidate);

            volumeAndPrice = GetWeightedPriceReverse(volumeAndPrice, maxVolume, x, y);
            maxVolume = volumeAndPrice.GetOutVolume();
            feeRate = matrix.getFee(x, y);
        }

        double result = outputVolume - maxVolume;

        return result;
    }

    static public double EstimateInputVolume(final double outputVolume, ArbitrageCandidate candidate) {
        int stepCount = candidate.getPathLength() - 1;

        int x = CandidateGetSrc(stepCount, candidate);
        int y = CandidateGetDst(stepCount, candidate);

        /* Initial value calculation */
        VolumeAndPrice volumeAndPrice = new VolumeAndPrice();

        /* calculates price per unit, considers the available volume at "x->y"*/
        volumeAndPrice = GetWeightedPriceReverse(volumeAndPrice, outputVolume, x, y);

        double feeRate = matrix.getFee(x, y);

        /* result.GetOutVolume() returns volume as "y" value */
        double maxVolume = volumeAndPrice.GetOutVolume();

        final double feeAmount = maxVolume * feeRate;

        /*
        now maxVolume contains amount which takes into account 
        the order book content, and it is reduced by commission
         */
        maxVolume = maxVolume - feeAmount;

        while (true) {

            double price = volumeAndPrice.GetPrice();
            double estimatedVolume = maxVolume / (price * (1 - feeRate));

            double bookVolume = matrix.GetTotalVolume(x, y);
            maxVolume = min(bookVolume, estimatedVolume);

            stepCount--;

            if (stepCount < 0) {
                break;
            }

            x = CandidateGetSrc(stepCount, candidate);
            y = CandidateGetDst(stepCount, candidate);

            volumeAndPrice = GetWeightedPriceReverse(volumeAndPrice, maxVolume, x, y);
            maxVolume = volumeAndPrice.GetOutVolume();
            feeRate = matrix.getFee(x, y);
        }

        return maxVolume;
    }

    static public double SimulateArbitrage(ArbitrageCandidate candidate, double amount) {

        final int pathLength = candidate.getPathLength();
        for (int i = 0; i < pathLength; i++) {
            int srcIdx = CandidateGetSrc(i, candidate);
            int dstIdx = CandidateGetDst(i, candidate);

            double price = GetWeightedPrice(amount, srcIdx, dstIdx);

            amount = amount * price;

            double feeRate = matrix.getFee(srcIdx, dstIdx);

            double feeAmount = feeRate * amount;

            amount = amount - feeAmount;
        }

        return amount;
    }

    static public double getPathProfit(final double outputVolume, ArbitrageCandidate candidate) {
        double inputAmount = EstimateInputVolume(outputVolume, candidate);
        double arbitrageResult = SimulateArbitrage(candidate, inputAmount);

        return arbitrageResult - inputAmount;
    }

    static private double estimateMaxSaturationVolume(ArbitrageCandidate candidate) {
        double inAmount = EstimateInputVolume(Double.MAX_VALUE, candidate);
        double arbitrageResult = SimulateArbitrage(candidate, inAmount);
        return arbitrageResult;
    }

    static private int CandidateGetSrc(int step, ArbitrageCandidate candidate) {
        return candidate.getPathElement(step);
    }

    static private int CandidateGetDst(int step, ArbitrageCandidate candidate) {
        if (step == (candidate.getPathLength() - 1)) {
            return candidate.getPathElement(0);
        }
        return candidate.getPathElement(step + 1);
    }

    static public double estimateFirstOrderMaxProfitVolume(ArbitrageCandidate candidate) {

        double price, bookVolume, feeRate, estimatedVolume;

        int step = candidate.getPathLength() - 1;

        int x = CandidateGetSrc(step, candidate);
        int y = CandidateGetDst(step, candidate);

        price = matrix.getFirstOrderPrice(x, y);
        estimatedVolume = matrix.getFirstOrderVolume(x, y) * price;

        feeRate = matrix.getFee(x, y);

        estimatedVolume = estimatedVolume * (1 - feeRate);

        while (true) {
            bookVolume = matrix.getFirstOrderVolume(x, y);
            price = matrix.getFirstOrderPrice(x, y);
            feeRate = matrix.getFee(x, y);
            estimatedVolume = estimatedVolume / (price * (1 - feeRate));
            estimatedVolume = min(bookVolume, estimatedVolume);
            step--;

            if (step < 0) {
                break;
            }

            x = CandidateGetSrc(step, candidate);
            y = CandidateGetDst(step, candidate);
        }

        return estimatedVolume;
    }

    static private final double goldenMidLeftRatio = (3 - sqrt(5)) / 2; //0.382;
    static private final double goldenMidRightRatio = 1 - goldenMidLeftRatio;// = (sqrt(5) - 1) / 2 = 0.618;
    static private final double pheta = goldenMidLeftRatio;
    static private final double tolerance = 0.0000001;

    static public double estimateMaxProfitVolume(ArbitrageCandidate candidate) {

        double minVolumeSample;
        double maxVolumeSample;
        double midVolumeSample;

        double proximity;
        double midVolume;

        double minVolume = estimateFirstOrderMaxProfitVolume(candidate);
        double maxVolume = estimateMaxSaturationVolume(candidate);

        double midPointLeft = minVolume + ((maxVolume - minVolume) * goldenMidLeftRatio);
        double midPointRight = minVolume + ((maxVolume - minVolume) * goldenMidRightRatio);

        /* to be removed */
        proximity = abs(maxVolume - minVolume);
        midVolume = (maxVolume + minVolume) / 2;

        minVolumeSample = getPathProfit(minVolume, candidate);
        maxVolumeSample = getPathProfit(maxVolume, candidate);

        double leftSample = getPathProfit(midPointLeft, candidate);
        double rightSample = getPathProfit(midPointRight, candidate);

        /* neccessary step count to get maximum can be caclulated using below's formula
            formula taken -  from lecture:https://www.math.ucla.edu/~wotaoyin/math273a/slides/Lec3a_1d_search_273a_2015_f.pdf at page 10/24, where L = interval length denoted as: abs(maxVolume - minVolume)
        */
        double C = 1 / log(1 / (1 - pheta));
        
        /* "+ 1" just in a case */
        final int maxStepCount = (int) ((Math.ceil(C * log(abs(maxVolume - minVolume) / tolerance)))) + 1;
        
        
        
        System.out.printf("maxStepCount=%d\n", maxStepCount);

        /* to be removed if debug information is not neccessary */
        midVolumeSample = getPathProfit(midVolume, candidate);
        int stepCounter = 0;
        do {

            /* to be removed if debug information is not neccessary */
            System.out.printf("%d) optimal volume=%f, max profit value=%.9f, extemum proximity=%.9f, minVolume:%f, minVolumeSample=%f, midPointLeft=%f, midLeftSample=%f, midPointRight=%f, midRightSample=%f, maxVolume=%f, maxVolumeSample=%f\n",
                    stepCounter, midVolume, midVolumeSample, proximity, minVolume, minVolumeSample, midPointLeft, leftSample, midPointRight, rightSample, maxVolume, maxVolumeSample);

            if (leftSample < rightSample) {
                minVolume = midPointLeft;
                minVolumeSample = leftSample;
                midPointLeft = midPointRight;
                leftSample = rightSample;
                midPointRight = minVolume + ((maxVolume - minVolume) * goldenMidRightRatio);
                rightSample = getPathProfit(midPointRight, candidate);
            } else if (leftSample > rightSample) {
                maxVolume = midPointRight;
                maxVolumeSample = rightSample;
                midPointRight = midPointLeft;
                rightSample = leftSample;
                midPointLeft = minVolume + ((maxVolume - minVolume) * goldenMidLeftRatio);
                leftSample = getPathProfit(midPointLeft, candidate);
            } else {
                System.out.println("!!!Very rare case!!!");
                
                /* very rare case: if(leftMidSample == rightMidSample) */
                minVolume = midPointLeft;
                minVolumeSample = leftSample;
                
                maxVolume = midPointRight;
                maxVolumeSample = rightSample;
                
                midPointLeft = minVolume + ((maxVolume - minVolume) * goldenMidLeftRatio);
                midPointRight = minVolume + ((maxVolume - minVolume) * goldenMidRightRatio);

                leftSample = getPathProfit(midPointLeft, candidate);
                rightSample = getPathProfit(midPointRight, candidate);
            }

            proximity = abs(maxVolume - minVolume);
            midVolume = (maxVolume + minVolume) / 2;

            /* to be removed if debug information is not neccessary */
            midVolumeSample = getPathProfit(midVolume, candidate);

            stepCounter++;
        } while ((tolerance < proximity)
                && (stepCounter < maxStepCount));

        /* to be removed if debug information is not neccessary */
        if (proximity < tolerance) {
            System.out.println("Tollerance matched");
        }

        /* to be removed if debug information is not neccessary */
        if (stepCounter >= maxStepCount) {
            System.out.println("Step count matched");
        }

        midVolumeSample = getPathProfit(midVolume, candidate);

        final double maxSampleValue = max(max(minVolumeSample, midVolumeSample), maxVolumeSample);

        if (maxSampleValue == minVolumeSample) {
            return minVolume;
        } else if (maxSampleValue == maxVolumeSample) {
            return maxVolume;
        } else {
            return midVolume;
        }
    }

}