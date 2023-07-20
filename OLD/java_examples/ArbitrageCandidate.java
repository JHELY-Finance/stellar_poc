public class ArbitrageCandidate {
  
  private int[] path;
  private double factor;
  private double profit;
  private int path_length;

  
  @Override
  public String toString() {
    String string = "";
    for(int k=0; k<path_length; k++) {
      string += this.getPathElement(k) + " -> ";
    }
    return "ArbitrageCandidate{"+string+"profit="+profit+"%}";
  }
  
  
  public int[] getPath() {
    return path;
  }

  
  public void setPath(int[] elements) {
    //path = Arrays.asList( ArrayUtils.toObject(elements) );
    this.path = elements;
  }
  
  
  public void setPathLength( int length ) {
    this.path_length = length;
  }
  
  public int getPathElement(int i) {
    return this.path[i]-1;
    //return this.path.get(i)-1;
  }
  
  public double getFactor() {
    return factor;
  }

  public void setFactor(double factor) {
    this.factor = factor;
  }

  public double getProfit() {
    return profit;
  }

  public void setProfit(double profit) {
    this.profit = profit;
  }

  public int getPathLength() {
    return this.path_length;
  }

  
}
