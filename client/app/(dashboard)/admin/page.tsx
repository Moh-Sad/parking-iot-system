import { ShieldAlert, Zap, Banknote, UserPlus, MapPin, Gauge, Activity, RotateCw, MoreHorizontal, AlertCircle } from "lucide-react";

export default function SupervisorDashboardPage() {
  return (
    <div className="flex flex-col gap-6">
      {/* Top Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* STAT 1 */}
        <div className="p-6 bg-card border border-border rounded-xl relative overflow-hidden group">
          <div className="absolute right-0 -bottom-4 opacity-[0.03] text-foreground group-hover:scale-110 transition-transform">
            <Activity size={100} />
          </div>
          <h2 className="text-xs font-semibold text-muted-foreground tracking-[0.15em] mb-4 uppercase">Total Stations</h2>
          <div className="text-3xl font-bold text-foreground">240</div>
          <p className="text-sm text-muted-foreground mt-2 font-medium">+12% vs last month</p>
        </div>

        {/* STAT 2 */}
        <div className="p-6 bg-card border border-border rounded-xl relative overflow-hidden group">
          <div className="absolute right-0 -bottom-4 opacity-[0.03] text-foreground group-hover:scale-110 transition-transform">
            <Zap size={100} />
          </div>
          <h2 className="text-xs font-semibold text-muted-foreground tracking-[0.15em] mb-4 uppercase">Active Sessions</h2>
          <div className="text-3xl font-bold text-foreground">1,842</div>
          <p className="text-sm text-muted-foreground mt-2 font-medium">Peak load at 94%</p>
        </div>

        {/* STAT 3 */}
        <div className="p-6 bg-card border border-border rounded-xl relative overflow-hidden group">
          <div className="absolute right-0 -bottom-4 opacity-[0.03] text-foreground group-hover:scale-110 transition-transform">
            <Banknote size={100} />
          </div>
          <h2 className="text-xs font-semibold text-muted-foreground tracking-[0.15em] mb-4 uppercase">Revenue</h2>
          <div className="text-3xl font-bold text-foreground">$42.5k</div>
          <p className="text-sm text-muted-foreground mt-2 font-medium">Daily AVG $1.4k</p>
        </div>

        {/* STAT 4 */}
        <div className="p-6 bg-card border border-border rounded-xl relative overflow-hidden group">
          <div className="absolute right-0 -bottom-4 opacity-[0.03] text-foreground group-hover:scale-110 transition-transform">
            <UserPlus size={100} />
          </div>
          <h2 className="text-xs font-semibold text-muted-foreground tracking-[0.15em] mb-4 uppercase">Active Users</h2>
          <div className="text-3xl font-bold text-foreground">12.4k</div>
          <p className="text-sm text-muted-foreground mt-2 font-medium">Retainment 82%</p>
        </div>
      </div>

      {/* Main Split Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* TRANSACTIONS SECTION (Left 2/3) */}
        <div className="lg:col-span-2 bg-card border border-border rounded-2xl flex flex-col p-6 min-w-0">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
            <div>
              <h2 className="text-xl font-bold text-foreground mb-1">Recent Transactions</h2>
              <p className="text-sm text-muted-foreground">Real-time ledger of network activity.</p>
            </div>
            <button className="px-4 py-2 border border-border rounded-lg text-sm font-medium hover:bg-secondary text-foreground transition-colors shrink-0">
              View All
            </button>
          </div>

          <div className="w-full overflow-x-auto rounded-lg">
            <table className="w-full text-left text-sm whitespace-nowrap min-w-[700px]">
              <thead>
                <tr className="border-b border-border/50 text-xs font-semibold tracking-widest text-muted-foreground uppercase">
                  <th className="pb-4 font-bold">Transaction ID</th>
                  <th className="pb-4 font-bold">Station Location</th>
                  <th className="pb-4 font-bold">Status</th>
                  <th className="pb-4 font-bold">Method</th>
                  <th className="pb-4 text-right font-bold">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                <tr className="group hover:bg-muted/10 transition-colors">
                  <td className="py-4 font-medium text-muted-foreground">TXN-94021-884</td>
                  <td className="py-4 text-foreground">Berlin North Cluster B4</td>
                  <td className="py-4">
                    <div className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-foreground"></div>
                      <span className="text-foreground font-medium">Completed</span>
                    </div>
                  </td>
                  <td className="py-4 text-muted-foreground">Corporate Fleet Card</td>
                  <td className="py-4 text-right font-bold text-foreground">$142.50</td>
                </tr>
                <tr className="group hover:bg-muted/10 transition-colors">
                  <td className="py-4 font-medium text-muted-foreground">TXN-94022-102</td>
                  <td className="py-4 text-foreground">Munich Tech Hub S1</td>
                  <td className="py-4">
                    <div className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground"></div>
                      <span className="text-muted-foreground font-medium">Pending</span>
                    </div>
                  </td>
                  <td className="py-4 text-muted-foreground">Direct Pay</td>
                  <td className="py-4 text-right font-bold text-foreground">$88.20</td>
                </tr>
                <tr className="group hover:bg-muted/10 transition-colors">
                  <td className="py-4 font-medium text-muted-foreground">TXN-94023-559</td>
                  <td className="py-4 text-foreground">Hamburg Port Terminal</td>
                  <td className="py-4">
                    <div className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-foreground"></div>
                      <span className="text-foreground font-medium">Completed</span>
                    </div>
                  </td>
                  <td className="py-4 text-muted-foreground">Mobile App Wallet</td>
                  <td className="py-4 text-right font-bold text-foreground">$31.00</td>
                </tr>
                <tr className="group hover:bg-muted/10 transition-colors">
                  <td className="py-4 font-medium text-muted-foreground">TXN-94024-912</td>
                  <td className="py-4 text-foreground">Paris Center High-Volt</td>
                  <td className="py-4">
                    <div className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-foreground"></div>
                      <span className="text-foreground font-medium">Completed</span>
                    </div>
                  </td>
                  <td className="py-4 text-muted-foreground">RFID Pass</td>
                  <td className="py-4 text-right font-bold text-foreground">$215.75</td>
                </tr>
                <tr className="group hover:bg-muted/10 transition-colors">
                  <td className="py-4 font-medium text-muted-foreground">TXN-94025-442</td>
                  <td className="py-4 text-foreground">London East EV Station</td>
                  <td className="py-4">
                    <div className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-destructive"></div>
                      <span className="text-destructive font-medium">Failed</span>
                    </div>
                  </td>
                  <td className="py-4 text-muted-foreground">Apple Pay</td>
                  <td className="py-4 text-right font-bold text-foreground">$15.00</td>
                </tr>
                <tr className="group hover:bg-muted/10 transition-colors">
                  <td className="py-4 font-medium text-muted-foreground">TXN-94026-118</td>
                  <td className="py-4 text-foreground">Tokyo Central Hub 7</td>
                  <td className="py-4">
                    <div className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-foreground"></div>
                      <span className="text-foreground font-medium">Completed</span>
                    </div>
                  </td>
                  <td className="py-4 text-muted-foreground">Corporate Fleet Card</td>
                  <td className="py-4 text-right font-bold text-foreground">$64.20</td>
                </tr>
                <tr className="group hover:bg-muted/10 transition-colors">
                  <td className="py-4 font-medium text-muted-foreground">TXN-94027-303</td>
                  <td className="py-4 text-foreground">Amsterdam West G1</td>
                  <td className="py-4">
                    <div className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground"></div>
                      <span className="text-muted-foreground font-medium">Pending</span>
                    </div>
                  </td>
                  <td className="py-4 text-muted-foreground">Direct Pay</td>
                  <td className="py-4 text-right font-bold text-foreground">$112.50</td>
                </tr>
                <tr className="group hover:bg-muted/10 transition-colors">
                  <td className="py-4 font-medium text-muted-foreground">TXN-94028-991</td>
                  <td className="py-4 text-foreground">Madrid Downtown Park</td>
                  <td className="py-4">
                    <div className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-foreground"></div>
                      <span className="text-foreground font-medium">Completed</span>
                    </div>
                  </td>
                  <td className="py-4 text-muted-foreground">Mobile App Wallet</td>
                  <td className="py-4 text-right font-bold text-foreground">$45.00</td>
                </tr>
                <tr className="group hover:bg-muted/10 transition-colors">
                  <td className="py-4 font-medium text-muted-foreground">TXN-94029-002</td>
                  <td className="py-4 text-foreground">Rome North Side B2</td>
                  <td className="py-4">
                    <div className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-foreground"></div>
                      <span className="text-foreground font-medium">Completed</span>
                    </div>
                  </td>
                  <td className="py-4 text-muted-foreground">RFID Pass</td>
                  <td className="py-4 text-right font-bold text-foreground">$180.00</td>
                </tr>
                <tr className="group hover:bg-muted/10 transition-colors">
                  <td className="py-4 font-medium text-muted-foreground">TXN-94030-776</td>
                  <td className="py-4 text-foreground">Vienna Inner City</td>
                  <td className="py-4">
                    <div className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-foreground"></div>
                      <span className="text-foreground font-medium">Completed</span>
                    </div>
                  </td>
                  <td className="py-4 text-muted-foreground">Direct Pay</td>
                  <td className="py-4 text-right font-bold text-foreground">$25.50</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* RIGHT SIDEBAR PANEL */}
        <div className="flex flex-col gap-8 h-full">
          <div className="flex-1 flex flex-col gap-6">
             <div className="bg-card border border-border rounded-2xl p-6">
               <div className="flex items-center justify-between mb-6">
                  <h3 className="text-sm font-bold tracking-widest text-muted-foreground uppercase">System Health</h3>
                  <button className="text-muted-foreground hover:text-foreground">
                    <MoreHorizontal size={20} />
                  </button>
               </div>
               
               <div className="relative flex justify-center py-6">
                 <div className="relative w-48 h-48">
                   <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                     {[...Array(8)].map((_, i) => (
                       <circle 
                         key={i}
                         cx="50" cy="50" r="42" fill="none" 
                         className={i % 2 === 0 ? "stroke-primary" : "stroke-secondary"} 
                         strokeWidth="8" 
                         strokeDasharray="28 235.89"
                         transform={`rotate(${i * 45} 50 50)`}
                       />
                     ))}
                   </svg>
                   <div className="absolute inset-0 flex flex-col items-center justify-center mt-1">
                     <div className="text-4xl font-black text-foreground tracking-tighter">94.8%</div>
                     <div className="text-[10px] font-bold tracking-widest text-muted-foreground uppercase mt-1">Optimal</div>
                   </div>
                 </div>
               </div>

               <div className="grid grid-cols-2 gap-4 mt-2 text-left">
                  <div className="border border-border/50 rounded-xl p-4 bg-muted/10">
                    <div className="text-[10px] font-bold tracking-widest text-muted-foreground uppercase mb-1">Latency</div>
                    <div className="text-2xl font-bold text-foreground">24ms</div>
                  </div>
                  <div className="border border-border/50 rounded-xl p-4 bg-muted/10">
                    <div className="text-[10px] font-bold tracking-widest text-muted-foreground uppercase mb-1">Uptime</div>
                    <div className="text-2xl font-bold text-foreground">99.9%</div>
                  </div>
               </div>
             </div>

             <div className="bg-card border border-border rounded-2xl p-6 flex flex-col h-[calc(100%-432px)] min-h-[350px]">
               <div className="flex items-center justify-between mb-6">
                  <h3 className="text-sm font-bold tracking-widest text-muted-foreground uppercase">Critical Alerts</h3>
                  <button className="text-muted-foreground hover:text-foreground">
                    <ShieldAlert size={16} />
                  </button>
               </div>

               <div className="space-y-4 flex-1">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-foreground text-background flex items-center justify-center shrink-0">
                      <AlertCircle size={20} />
                    </div>
                    <div>
                      <div className="text-sm font-medium text-foreground">Tiergarten District</div>
                      <div className="text-xs text-muted-foreground mt-0.5">2m ago</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-foreground text-background flex items-center justify-center shrink-0">
                      <Zap size={20} />
                    </div>
                    <div>
                      <div className="text-sm font-medium text-foreground">Mitte Hub Node B</div>
                      <div className="text-xs text-muted-foreground mt-0.5">14m ago</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-foreground text-background flex items-center justify-center shrink-0">
                      <RotateCw size={20} />
                    </div>
                    <div>
                      <div className="text-sm font-medium text-foreground">32 Devices Pending</div>
                      <div className="text-xs text-muted-foreground mt-0.5">45m ago</div>
                    </div>
                  </div>
               </div>
               
               <button className="w-full mt-6 pt-6 text-xs font-bold tracking-widest text-muted-foreground hover:text-foreground uppercase border-t border-border transition-colors">
                  View Incident Log
               </button>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}
