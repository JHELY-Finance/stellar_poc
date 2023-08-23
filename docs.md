A brief Explanation of functions

* `fetchTradedAsset`
    - initializes two 2d arrays balAmount and tradeAmount which stores how much asset is extra to match first order 
and how much asset will be traded
    - startAmount stores how much initial asset wallet holds.
    - traverses for each unique path.
        - curramount stores amount of current asset wallet holds after each iteration it's valued in the current currency 
not base. (at 2nd iteration asset is usdc so it will store how much usdc it will get upon swapping it for 1st tradepair )
        - pairBalance and pairtraded are arrays which stores the amount of balance asset and amount of asset traded for 
ith path
        - traverses for ith path orderbook array which looks like -> [orderbook(A/B), orderbook(B/C), orderbook(C/A)]
            * stores bid amount what best offer is offering
            * checks if the bid amount is greater than the current asset amount
            * if current asset is greater than the bid amount it completely matches the offer amount and stores in 
pairtraded and extra asset in pairbalance which has to be returned to base currency with even swaps
            * if it's less than offered amount it trades it fully and stored in pair traded and pair balance stores 0.
            * now currAmount is multiple of pair traded and the offer bid price.
         - last current amount is pushed to the pairtraded as it's the amount after all swaps and in base currency.
    - pair balance and pair traded is pushed to the balAmount and traded amount 2d array and stored as it's ith element.
    - Now coreection of traded asset is done as we might have early swapped extra asset but later found that this much 
quantity can't be swapped at the price so we should traverse back and correct the traded asset.
    - It traverses from the last element to the 2nd element as 1st elemt is what wallet holds and not need to be corrected.
      - checks if balAmount of jth pair in ith path is greater than 0 or not
      - exasset is calculated and stores how much previous asset is swapped extra and swaps it on the samw price 
( not we are dividing it by [i-1] like now we are not swapping ir for 2->1 as it will fail the basic principle 
instead we are going back a step and deducting extra asset to be swapped).
      - previous balAmount is incremented by that amount of exasset and that amount of tradeAmount is deducted from the trade.
      - now current balance amount is 0.
      - it traverses from the back and take each element as a guy and it pay's back its debt and if it's next person pays back his debt he gains that much money and can now pays back that much debt he own if any
  - returns the tradeamount each asset is traded.



