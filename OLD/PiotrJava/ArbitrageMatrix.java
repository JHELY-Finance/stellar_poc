import java.util.concurrent.locks.StampedLock;
import static pl.nethuns.main.App.assetsDictionary;
import pl.nethuns.model.OrderBook;

public class ArbitrageMatrix {
  
  
  private final OrderBook price_matrix[][];
  private final int size;
  
  
  public ArbitrageMatrix(int _size) {
    size = _size;
    price_matrix = new OrderBook[ size ][ size ];
  }
  
  
  public synchronized int getSize() {
    return size;
  }
  
  
  public synchronized OrderBook get( int x, int y ) {
    return price_matrix[x][y];
  }
  
  
  public synchronized void insert(OrderBook book) {
    price_matrix[ book.getBaseIndex()  ][ book.getQuoteIndex() ] = book;
    price_matrix[ book.getQuoteIndex() ][ book.getBaseIndex()  ] = book;
  }
   
   
  
  // x(base) y(quote)
  // x/y -> sprzedaję -> bid price
  // y/x -> kupuję    -> 1/ask price
  public synchronized double getFirstOrderPrice( int x, int y) {    
    final OrderBook book = price_matrix[ x ][ y ];
    if (x == y) {
      return 1;
    }
    if (book != null) {
      if ((book.getBaseIndex() == x) && (book.getQuoteIndex() == y))  {
        if ( book.getBids().size() > 0 ) {
          return book.getBid(0).getPrice();
        } else {
          return Double.NaN;
        }
      }
      if ((book.getQuoteIndex() == x) && (book.getBaseIndex() == y)) {
        if (book.getAsks().size() > 0) {
          return 1/book.getAsk(0).getPrice();
        } else {
          return Double.NaN;
        }
      }
    }else{
        return Double.NaN;
    }
    return Double.NaN;
  }
  
  
  public int getBookSize(int x, int y) {
        OrderBook book = price_matrix[x][y];
        if (book != null) {
            if (book.getBaseIndex() == x) {
                return book.GetBidsSize();
            }
            if (book.getQuoteIndex() == x) {
                return book.GetAsksSize();
            }
        }
        return 0;
   }
  
    public double getOrderVolume(int x, int y, int orderId) {
        OrderBook book = price_matrix[x][y];
        if (book != null) {
            if (book.getBaseIndex() == x) {
                return book.getBid(orderId).getVolume();
            }
            if (book.getQuoteIndex() == x) {
                return book.getAsk(orderId).getVolume() * book.getAsk(0).getPrice();
            }
        }
        return 0;
    }
    
    public double getOrderPrice(int x, int y, int orderId) {
        OrderBook book = price_matrix[x][y];
        if (x == y) {
            return 1;
        }
        if (book != null) {
            if ((book.getBaseIndex() == x) && (book.getQuoteIndex() == y)) {
                return book.getBid(orderId).getPrice();
            }
            if ((book.getQuoteIndex() == x) && (book.getBaseIndex() == y)) {
                return 1 / book.getAsk(orderId).getPrice();
            }
        }
        return 0;
    }
    
    public double GetTotalVolume(int x, int y) {
        final int bookSize = getBookSize(x, y);
        double totalVolume = 0;
        for (int i = 0; i < bookSize; i++) {
            totalVolume += getOrderVolume(x, y, i);
        }
        return totalVolume;
    }
  
  // x(base) y(quote)
  // x/y -> sprzedaję -> bid volume
  // y/x -> kupuję    -> ask volume * ask price
  public synchronized double getFirstOrderVolume( int x, int y ) {
    final OrderBook book = price_matrix[ x ][ y ];
    if (book != null) {
      if ((book.getBaseIndex() == x) && (book.getQuoteIndex() == y))  {
        if (book.getBids().size() > 0) {
          return book.getBid(0).getVolume();
        } else {
          return Double.NaN;
        }
      }
      if ((book.getQuoteIndex() == x) && (book.getBaseIndex() == y)) {
        if (book.getAsks().size() > 0) {
          return book.getAsk(0).getVolume() * book.getAsk(0).getPrice();
        } else {
          return Double.NaN;
        }
      }
    }
    return 0;
  }
  
      
  public double getFee(int x, int y) {
    final OrderBook book = price_matrix[ x ][ y ];
    return book.getFee().getQuantityFee();
  }
  
  
  
  public synchronized void print() {
    final int length = price_matrix.length;
    
    /*StampedLock lock = new StampedLock();
    long stamp = lock.readLock();*/
            
    //try {
      System.out.println("");
      for(int i=0; i<length; i++) {
        if (i == 0) {
          System.out.print("           ");
          for (int j=0; j<length; j++) {
            System.out.printf( "| %1$-14s ", assetsDictionary.getByIndex(j)+"("+j+")" );
          }
          System.out.println("");
        }
        for(int j=0; j<length; j++) {
          if (j == 0) {
            System.out.printf( " %1$-10s", assetsDictionary.getByIndex(i)+"("+i+")" );
          }
          System.out.printf( "| %1$-14f ", this.getFirstOrderPrice(i, j) );
        }
        System.out.println("");
      }
    /*} finally {
      lock.unlockRead(stamp);
    }*/
  }
  
  
  public synchronized String logPair(int x, int y) {
    return price_matrix[ x ][ y ].logPair();
  }
  
}
