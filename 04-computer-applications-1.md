# ISS Paper-I · Topic (iv) COMPUTER APPLICATION & DATA PROCESSING — PYQ Data-Mine (2018–2026)

**Corpus:** 720 Q total. **Computer Applications = exactly 180 Q (25% of paper, 20 Q/year — every year).** Unlike the other three topics, this is almost entirely **GK-style fact recall**, not derivation — there is no "solve for $x$" here, only "know the correct term." The shortcut sheet below is therefore a **reference-table set**, not a formula list; treat wrong answers as vocabulary gaps to close, not calculation errors to debug.

---

## Master weightage grid

| # | Subtopic | ~Total | Read |
|---|---|---|---|
| A | Number systems & data representation | 22 | conversions + 2's-complement are the two workhorse templates |
| B | CPU, memory & computer architecture | 24 | registers, memory hierarchy, memory-address-line arithmetic |
| C | Operating systems (processes, scheduling, memory mgmt, deadlock) | 26 | **largest bucket**; paging/segmentation and process-state confusion are the top traps |
| D | Software, languages & compilation | 16 | compiler vs. interpreter, low/high-level, linker/loader/debugger |
| E | Networking (topologies, devices, protocols, media) | 26 | protocol-to-layer mapping is the single most-repeated template |
| F | Computer security | 12 | virus/malware taxonomy, encryption basics |
| G | Data structures, algorithms & programming basics | 18 | mostly conceptual (stability, complexity terms), light on real code |
| H | Databases & SQL | 8 | DBMS models, ACID, basic SQL truth-statements |
| I | I/O devices, storage & peripherals | 16 | device-to-category matching |
| J | Multimedia & misc GK | 12 | ISO standards, steganography, virtual reality, phishing scenarios |

---

## A. Number Systems & Data Representation

**Conversion drill (verified anchors — use as templates):**
- Octal→decimal with fraction: $(325.12)_8=3{\cdot}8^2+2{\cdot}8+5+1{\cdot}8^{-1}+2{\cdot}8^{-2}=213.15625$ (18-Q62).
- Binary→hex: group in 4s from the binary point **both directions**: $(111110111.110101)_2\to$ pad to `0001 1111 0111 . 1101 0100`$=(1F7.D4)_{16}$ (20-Q50).
- 8421-BCD→decimal: split into 4-bit nibbles directly, one digit each: `0101 0010 0001.0110`$\to521.6$ (20-Q51).
- Octal→hex via binary bridge: $(6251)_8\to$binary$\to$regroup in 4s$\to(CA9)_{16}$ — **appears in 2019-Q78 and 2023-Q79 with identical numbers**, both resolving to CA9.
- 2's complement of $-59$, 8-bit: $59=00111011\to$ flip$=11000100\to+1=11000101$ — **repeats verbatim in 2022-Q35 and 2024-Q46**.
- Address lines for $2^n$ locations: $n=\log_2(\text{locations})$ — 1024 locations $\Rightarrow10$ lines (18-Q63); with **multiple identical chips** wired in parallel (address lines shared, data lines multiply), don't add chip-count to the address-line total (21-Q72's "4 chips" is a data-line question, not address-line).
- Disk capacity $=\text{surfaces}\times\text{tracks}\times\text{sectors}\times\text{bytes/sector}$: $16\times256\times16\times512=33{,}554{,}432$ bytes (18-Q79).
- Highest digit in base $b$ system $=b-1$ (22-Q32) — **not** $b$ itself, a routine off-by-one.

**Anchors (broader set):** 18-Q66/67 (normalised floating-point form; max unsigned 8-bit integer $=127$ for *signed* representation — watch signed vs. unsigned framing) · 18-Q68/73 (bitwise-vs-logical operator classification — `&&`,`!` are logical not bitwise; BCD is 8421-weighted **not** 1246; octal is base-8 **not** base-2) · 19-Q42/43 (weighted-code identification — Gray code is **not** positional-weighted, the others are; binary long division) · 20-Q43/57/59 (weighted-code triple, same trap as above; wireless standard is **802.11b**, watch digit-transposition distractors like 803.11 or 801.11; invalid hex digit is any letter $>F$, e.g. `G`) · 22-Q39 (hex→octal via binary bridge, same method as above reversed) · 23-Q67 (base-$X$ puzzle: $(110)_X=(1100)_2=12_{10}\Rightarrow X^2+X=12\Rightarrow X=3$; Gray-code conversion needs XOR-chain, verify digit-by-digit) · 24-Q54 (hex-equivalent statement + "complement of 47" ambiguity — clarify 1's vs 2's, 9's vs 10's complement convention stated) · 25-Q35 (octal→hex and hex→decimal statement pair, same bridge method) · 26-Q49/58/63 (falling-factorial-flavoured Δ⁴ — cross-listed with Numerical Analysis; octal↔decimal↔hex statement-pair, verify each independently rather than assuming both true/false together).

**TRAP:** Gray code is **not** a positional weighted code (each bit's "value" isn't fixed — only one bit changes between consecutive values, which is precisely *why* it's used, and precisely why it *isn't* weighted) — this exact mis-classification is tested in both 19-Q42 and 20-Q43.

---

## B. CPU, Memory & Computer Architecture

**Registers:** Program Counter (PC) — address of the *next* instruction; Instruction Register (IR) — holds the *current* instruction being decoded; Accumulator — holds arithmetic results; Memory Address Register (MAR) / Memory Buffer Register (MBR) — address/data staging for memory access.

**Memory hierarchy (fastest→slowest, smallest→largest):** Registers → Cache → RAM (primary/main) → Secondary (disk) → Tertiary/optical. Cache is faster than RAM, slower than registers (never the reverse). **Cache is always smaller than RAM** — the false "cache always kept higher than RAM" statement is a standing trap (23-Q65).

**ROM family:** ROM (factory-programmed, unchangeable) → **PROM** (user-programmable **once**, unerasable after) → **EPROM** (UV-erasable, reprogrammable) → **EEPROM** (electrically erasable, byte-level rewrite — basis of flash memory).

**Anchors:** 18-Q61 (ALU/CU/CPU containment hierarchy — ALU **is** a component of CPU, not of Control Unit; CU is **not** a component of ALU) · 18-Q69/74 (auxiliary/secondary memory $=$ magnetic tape, not SRAM/cache/flash-ROM; max integer in $n$-bit word $=2^{n-1}-1$ for **signed** representation) · 19-Q62/63/70 (associative memory $=$content-addressable, no address needed; tightly-coupled systems **share** common memory/bus — the "does NOT share" answer is *distributed* systems; flash memory best fits mobile/camera/iPod use) · 20-Q54/55/58/60 (ROM contents can't be erased, contrast RAM/virtual/cache; 1 GB $=1024\times1024$ **KB** not MB/TB — verify the unit pairing carefully, this is a frequently-flipped distractor; flip-flop stores 1 bit; secondary memory is for **permanent** storage) · 21-Q74/77 (cache/ROM/registers are internal-to-CPU-or-tightly-coupled memory; ROM search-order — CPU checks **cache first**, then main memory, not ROM/secondary directly) · 22-Q31/63/76 (Program Counter tracks next instruction, direct; CPU data-processing units $=$ Memory unit + CPU/ALU, **not** Monitor which is output-only; DRAM/SRAM are volatile, **EPROM is non-volatile** — the only non-volatile option among the three) · 23-Q63/65 (segmentation $=$ dividing physical memory into variable-size blocks, contrast with paging's fixed-size frames; cache-memory 3-statement block, size/speed/hit-rate) · 24-Q46 (2's complement, repeat, see §A) · 25-Q37 (space complexity $=$ memory required by an algorithm, contrast time complexity) · 26-Q66/71/72/78/80 (RISC fixed instruction length $=32$ bits; optical storage reads via **laser light**; excessive plotter pen speed **distorts** lines, doesn't improve resolution/accuracy; laser-printer dots $=1200^2\times8\times10=115.2$ million, direct area$\times$density² computation; Accumulator stores ALU results, direct).

**TRAP:** "1 GB = 1024×1024 ___" trips on the *unit*, not the arithmetic — it's Kilobytes (equivalently $1024$ MB, equivalently $2^{20}$ KB), and options substituting MB/TB/plain-Bytes for the blank are all wrong (20-Q55). Signed vs. unsigned framing silently changes "max representable value" answers by exactly one bit's worth — always check which is stated.

---

## C. Operating Systems — Processes, Scheduling, Memory Management, Deadlock

**Process lifecycle:** New → Ready → Running → (Waiting/Blocked ⇄ Ready) → Terminated. "Deadlock" is a **condition**, not a formal process state, in the standard 5-state model — a frequent false option.

**Deadlock's four *necessary, jointly-sufficient* conditions:** Mutual exclusion, Hold-and-wait, No pre-emption, **Circular wait** (often the omitted 4th option in a 3-item MCQ list — treat 3-of-4 listed as still "necessary conditions," per how these questions are typically keyed).

**Memory management:** **Paging** — physical memory split into **fixed-size** frames, logical memory into equal-size pages, virtual→physical mapping via a page table (no external fragmentation, some internal). **Segmentation** — memory split into **variable-size**, logically-meaningful blocks (code/data/stack segments). **Swapping** — moving entire processes between RAM and disk. A **page fault** = reference to a page currently **not** in main memory.

**Scheduling:** FCFS (no preemption, simple queue), SJF (shortest job first, can starve long jobs), Priority, **Round Robin** — fixed time-slice/quantum per process, cycling through the ready queue (the defining "specific time slice" answer).

**Anchors:** 18-Q64/76/77/78 (UNIX core $=$ Kernel, not shell/directories; compiler diagnoses **grammatical** (syntax) errors, not logical ones; firmware $=$ software in ROM, hard to change; program **can** run with a logical error — it just gives wrong output, contrast with syntax/runtime errors which halt execution) · 19-Q63/68/69 (distributed systems don't share common memory/bus; paging maps virtual↔physical efficiently; OS functions triple — memory, device, **and** security management, all three) · 20-Q56 (ISO 27001 $=$ Information Security Management, not quality/environmental/health) · 21-Q56/72/73/75 (paging uses virtual-address mapping, direct; data-line vs. address-line distinction with multiple chips; OS security's major problem is broadly **authentication**, per standard textbook framing; debugging process $=$ replicate→understand→fix (**test** is sometimes the 4th, watch which 3-of-4 the option set uses)) · 22-Q33/40/72 (all three named conditions are necessary for deadlock, see boxed fact above; batch OS — jobs run **in sequence automatically** after the prior finishes, **not** by priority, and debugging **during** execution is *not* possible in batch mode; machine-cycle 3-statement — a 6-instruction program needs 6 machine cycles is **true** for simple non-pipelined execution) · 23-Q63/66 (segmentation, direct; Real-Time OS responds within a bounded/predetermined time, contrast Time-Sharing/Batch/Embedded) · 24-Q41/42/62 (debugger 3-statement — detects errors, step-execution, **and** pause-until-corrected, all three true; OS 3-statement — principal system-software component, resource management, **and** user interface, all three true; RK4$>$Euler order statement, cross-listed with Numerical Analysis §L) · 25-Q33/36 (Round Robin $=$ time-slice scheduling, direct; Linux is multi-user, multitasking, **and** multiprocessor-capable, all three) · 26-Q64/65/73/77 ("Deadlock" is **not** a formal process state — Ready/Executing/Terminated are, Deadlock is a condition; **absolute loading** — allocation is handled by the **assembler**, not the loader, which is the inverted/relocatable-loading norm; page fault $=$ access to a page **not currently in memory**, direct).

**TRAP:** "Deadlock" as a process-*state* option (26-Q64) is a routine false-friend — it's a *system condition* arising from 4 simultaneous resource-allocation properties, never a listed state in the New→Ready→Running→Waiting→Terminated cycle. Batch-processing OS runs jobs strictly **in the order fetched**, not "by priority" — priority scheduling is a separate algorithm, not inherent to batch processing (22-Q40).

---

## D. Software, Languages & Compilation

**Compiler** — translates the *entire* program to machine code **before** execution (diagnoses only syntax/grammatical errors, not logic). **Interpreter** — translates **and executes line-by-line simultaneously** (contrary to a repeated false option claiming it "translates the whole program first"). **Assembler** — converts assembly (low-level, mnemonic) to machine code. **Linker** — combines multiple object files/libraries into one executable. **Loader** — loads the executable into memory for execution; in **absolute loading**, the *assembler* (not loader) does the address allocation up front.

**Anchors:** 18-Q70/80 (interpreter translates+executes simultaneously — the "compiler does this" option is the standing false-friend; machine language is the canonical low-level language, contrast FORTRAN/COBOL/C which are all high-level) · 19-Q44/48 (linker assembles object modules into one program; subroutine reduces code length **and** is stored/called from memory — statement on stack usage is the one to scrutinise, subroutines typically **do** use a stack for return addresses, making "does not require stack" the false statement) · 20-Q47 (C# is Microsoft .NET's designed language, not Python/VB/Java in that specific framing) · 21-Q53/80 (Python is interpreted, open-source, clear-syntax, **platform-independent** — "platform-dependent" is the false statement to flag; lexical analyzer outputs a **token list**, not a parse tree/intermediate/machine code) · 22-Q37 (DES is a **symmetric-key** algorithm, cross-listed with §F) · 23-Q61/68/76/78 (CISC variable-length instructions, RISC parallel-processing-friendly, ARM-is-RISC — all three true; modular programming (functions/modules) is the defining Assembly/Structural-language feature per the question's framing; RISC's edge is compact size **and** small instruction set, **not** "executing multiple clock cycles" which is actually more CISC-like; math-library linking statement is true, OS-independence-of-dev-steps statement is the false half) · 24-Q47 (interpreter statement pair — compiler+interpreter **can both** eventually reach machine code, but "interpreter translates the whole program first" is false, restating the core interpreter/compiler distinction) · 25-Q37/38/72 (space complexity; runtime environment manages memory/GC/runtime tasks, **not** direct compilation; linker's purpose is combining object files+libraries into an executable, direct) · 26-Q61/67/70/73 (Kernel is UNIX's core, repeat; Python is web-capable, interpreted, **and** platform-independent, all three; UNIX is written in **C**; absolute loading — allocation done by assembler, repeat from §C).

**TRAP:** "The interpreter translates the whole program into machine language before executing any instruction" is a **repeated false statement** (18-Q70, 24-Q47) — this is precisely the *compiler's* behaviour; interpreters go line-by-line, translate-then-execute-immediately, no whole-program pre-translation.

---

## E. Networking — Topologies, Devices, Protocols, Media

**Protocol-to-layer map (the single highest-yield table in this file):**

| Layer | Protocols |
|---|---|
| Application | HTTP, FTP, SMTP, DNS, DHCP, POP3, IMAP, SNMP, Telnet |
| Transport | TCP, UDP |
| Network | IP, ICMP, **ARP** (resolves IP↔MAC) |
| Physical/Link | Ethernet, Wi-Fi (802.11 family) |

**Topologies:** Bus — single shared backbone cable, all nodes tap in. Star — central hub; **hub failure takes down the whole network** (single point of failure — "hub fails, network unaffected" is a standing false option), but *one node's* failure doesn't affect others; easy fault isolation is its genuine advantage. Ring — each node connects to exactly two neighbours. Mesh — every node interconnected; most fault-tolerant (failure of one node never isolates others).

**Anchors:** 18-Q41 (terminal $=$ keyboard + display monitor pairing) · 19-Q41/46/50/61/64/66/67 (bus $=$ address/control/**data** bus carries data+addresses between components, "data bus" is the direct-fit answer; Network Protocol handles error detection/correction **and** message formatting **and** connection initiation/termination — the "cannot do X" statements are the false ones to flag; SMTP sends email (contrast POP3/IMAP which *retrieve*); DNS resolves domain↔IP; fiber optic supports the **highest** bandwidth among listed media; NICNET is India's government network, not ARPANET/Quicknet) · 20-Q41/44/52/57 ("terminal" device pairing, repeat-style; ARP is **not** an application-layer protocol — it's Network layer, the one exception among FTP/DNS/SNMP which *are* application-layer; steganography $=$ hiding info inside images (contrast root-kits/bit-mapping/rendering); 802.11b is the wireless standard, watch digit transpositions) · 21-Q51/52/60 (hierarchical DBMS model $=$ tree-structured, cross-listed §H; star topology's real advantage is easy error detection, **not** "hub failure has no effect" which is false, and "requires more cable" is a real *disadvantage* not listed as the answer; SVG is **vector**, not raster — the one non-raster format among JPEG/TIFF/GIF/SVG) · 22-Q36/38/39 (raster formats $=$ JPEG, GIF, PNG — **SVG is vector**, repeat trap; leased line $=$ dedicated phone connection, contrast dial-up/DSL/ISDN which are shared/switched; hex→octal bridge conversion) · 23-Q64/70/73/75/80 (SMTP/FTP/DHCP are application-layer, IP/TCP are not — "1,2,3" style answer; TCP/IP is the Internet's protocol, NIC connects to network, **but IP address is a *logical* address, NOT a hardware address** — that's the MAC address, a routinely-confused pair; modem converts digital↔analog; OCR/OMR/MICR — supermarket character recognition specifically uses **MICR** (checks) is sometimes conflated with barcodes (which are actually optical *bar* readers, not OCR/OMR/MICR strictly) — verify against the specific device named in the question; firewall terminology $=$ gateway, proxy server, screening routers, all three) · 24-Q44/45/50/52/55/56 (non-repudiation prevents denial of a sent/received message, contrast authentication/confidentiality/integrity; ICMP+ARP operate at the **Network** layer; email port sequence SMTP=25, POP3=110, IMAP=143; IPSEC router-to-router messaging $=$ **tunneling**; HTTP/FTP/SMTP framing — careful, FTP is Application-layer *and* uses control+data connections, don't misfile as Network-layer; repeater/bridge/hub are connecting devices, **Bluetooth is a wireless *standard/technology*, not primarily classified as a wired "connecting device"** in this taxonomy — watch this 4th-option trap) · 25-Q31/32/34/75/78/79 (bus topology $=$ single backbone; hub connects star-topology nodes; SSD advantages $=$ performance+price+reliability triple, **not power/heat** in some framings — verify against the specific 3-of-4 offered; router interconnects networks **and** forwards by destination-IP examination, both statements true; packet-filter firewall checks/allows-or-blocks **all** IP packets by rule, not selectively "some users"; Wi-Fi $=$ IEEE **802.11**) · 26-Q62/69/74/75/76/79 (802.11**ad** has the highest data rate among the 802.11 variants listed; ARP resolves IP→MAC, direct repeat; polymorphic virus **changes its own code** each infection to evade signature-based detection — contrast stealth (hides presence) and multipartite (infects multiple target types); Direct Memory Access lets peripherals transfer data **without constant CPU involvement**, contrast polling/interrupt-driven which both need CPU attention per event; the credit-card-email-link scenario is textbook **phishing**, not Trojan/blackmail/generic-virus; a **worm** self-propagates computer-to-computer with **no user interaction**, contrast Trojan (needs user to run it) and boot-sector virus (needs infected media).

**TRAP:** ARP sits at the **Network** layer in the standard TCP/IP teaching model despite resolving a *link-layer* (MAC) address — this placement is tested repeatedly (20-Q44, 24-Q45, 26-Q69) and is the most-recycled single fact in the entire Computer Applications topic. IP address is a **logical**, software-assigned address; MAC address is the **hardware** address — conflating the two (23-Q70's false statement 3) is a standing trap.

---

## F. Computer Security

**Malware taxonomy (the exam's favourite confusion set):**
- **Virus** — attaches to a host file/program, needs the host to run to spread.
- **Worm** — self-replicating, spreads **without any user action**, network-aware.
- **Trojan** — disguised as legitimate software; needs the user to run it; does *not* self-replicate.
- **Spyware** — covertly gathers information about a user/organisation.
- **Polymorphic virus** — rewrites its own code each infection to dodge signature detection.
- **Stealth virus** — actively hides its presence/modifications from the OS.
- **Phishing** — social-engineering via fake communications (email/link) to harvest credentials.

**Encryption:** Symmetric (one shared key, e.g. **DES**) vs. Asymmetric (public/private key pair, e.g. digital signatures). SSL — application-**independent** security/privacy layer over the internet.

**Anchors:** 19-Q45/47 (antivirus is **utility** software (sometimes also tagged system-adjacent) — not pure application software; spyware gathers info covertly, direct) · 20-Q52 (steganography, repeat from §E) · 22-Q37/75 (DES is symmetric-key, direct; SSL provides application-independent internet security) · 23-Q72 (digital signatures use **two** keys public+private; secret-key crypto uses **one** shared key — both true; "encryption converts cipher→plain" is **backwards** — encryption is plain→cipher, decryption is the reverse) · 25-Q78 (packet-filter firewalls inspect **all** IP packets against rules) · 26-Q74/76/79 (polymorphic virus, phishing scenario, worm — all three defined in the box above, each tested as a distinct scenario/definition-matching question).

**TRAP:** "Encryption converts cipher text into plain text" (23-Q72, statement 1) is **backwards** by definition — encryption goes plaintext→ciphertext; this exact reversed-direction trap is worth memorising as a phrase-level red flag, not just a concept to know.

---

## G. Data Structures, Algorithms & Programming Basics

**Sorting stability** (equal-key elements keep relative order): **Bubble sort — stable. Insertion sort — stable. Merge sort — stable. Quick sort — NOT stable** (in its standard in-place partitioning form) — this exact 4-way classification is the recurring question.

**Complexity vocabulary:** Time complexity — operations vs. input size. **Space complexity — memory required by an algorithm** (25-Q37, 25-analogue). Debugging = replicate → understand → fix (± test), using breakpoints (pause execution for inspection) and step-execution.

**Anchors:** 18-Q71/72/75 (`while(x!=y){if(x>y)x-=y;else y-=x;}` computes the **GCD** via repeated subtraction — recognise the classic Euclidean-subtraction pattern instantly rather than tracing it; array = same-type collection, strings = char-arrays (1 byte/char), **both** statements about arrays holding same-type-only and strings-being-data-arrays are true; unary/assignment operators are right-to-left, logical/bit-manipulation are left-to-right — "1 and 2 only" pattern) · 20-Q42 (expression-well-formedness 3-statement — operand-after-operator, no adjacent operators, balanced brackets, all three necessary) · 23-Q77 (stability 4-way check — Bubble, **Merge**, **Insertion** stable; **Quick** not — "1,3,4" pattern) · 25-Q39/76 (breakpoints pause execution for inspection, direct; Do-While is the construct for condition-based repeated execution, contrast If-Then/Case) · 26-Q59 (binomial-coefficient/Δ-operator identity, cross-listed §K of Numerical Analysis file).

**TRAP:** Quicksort's instability is **specific to its standard partition-exchange implementation** — this is a memorised fact, not something to "reason out" from first principles under time pressure; keep the 4-algorithm table above as a flash fact.

---

## H. Databases & SQL

**DBMS models:** Hierarchical — tree-structured records. Network — graph-structured (records can have multiple parents). Relational — tables with keys. **ACID properties:** Atomicity, Consistency, Isolation, Durability (a "Security" 4th option is always a false 4th member — security is a *feature*, not one of the ACID guarantees).

**Anchors:** 21-Q51 (hierarchical model $=$ tree structure, direct) · 22-Q80 (ACID triple check — "1,2,3" (Atomicity, Durability, Isolation) correct, **Security is not an ACID property**, the standing 4th-option trap) · 23-Q71 (SQL executes queries **and** updates records — both true; "SQL automatically eliminates duplicates" is **false**, `SELECT` returns duplicates unless `DISTINCT` is explicit) · 25-Q40 (client-server DBMS — the **Server** is primarily responsible for access/security/integrity management, not the client/query-processor/DBA individually in this framing) · 26-Q60 (hierarchical model, cross-referenced from an earlier year's identical question phrasing).

**TRAP:** "SQL query automatically eliminates duplicates" is false by default — this requires `DISTINCT` explicitly; a repeated false-statement bait (23-Q71).

---

## I. I/O Devices, Storage & Peripherals

**Input:** keyboard, mouse, scanner, **webcam** (input device — a repeated true-statement anchor), light pen, joystick, touchscreen, OCR/OMR/MICR readers. **Output:** monitor, printer, plotter, speaker. **Storage (SSD vs HDD):** SSD wins on performance, reliability, low power/heat — **price** is usually the one SSD loses on (a recurring "which 3 of 4 are advantages" trap where "low price" is the false member).

**Anchors:** 19-Q41 (terminal device pairing) · 20-Q46/49/53 (OCR+OMR+MICR are all optical-character/mark recognition devices, "1,2,3" pattern; CRT internals — electron gun, coils, **and** screen all genuinely internal, "1,2,3"; not-a-browser $=$ Apple **iOS** (an OS, not a browser) among Chrome/IE/Firefox) · 21-Q59/74 (output devices $=$ printer+speaker+plotter, **webcam is an input device** — the 4th-option trap; internal-process memory $=$ cache+registers (**and sometimes ROM**, verify the specific 3-of-4 the question offers) · 23-Q75 (supermarket character recognition $=$ MICR specifically, per the question's stated context — don't default to OCR/OMR without checking the stated use-case) · 24-Q48/58 (webcam is an input device, **and** for smooth/clear video you want **high** frame rate **and high** (not minimal) resolution — statement 3's "resolution is minimum" is the false half; light pen/touchscreen/joystick — joystick's "one particular direction only" claim is the false statement, joysticks move in multiple directions) · 25-Q34 (SSD-advantage 3-of-4 selection, watch which attribute is the false 4th) · 26-Q71/78 (optical storage uses **laser light**; laser-printer dot count $=(1200\times8)\times(1200\times10)=115.2$ million, direct area×density² computation).

**TRAP:** Webcam is unambiguously an **input** device — it's tested as a true-statement anchor (24-Q48) specifically because students sometimes second-guess this given it "outputs" a video *feed* to the screen; the device itself only ever *captures* (inputs) data.

---

## J. Multimedia & Miscellaneous GK

**Anchors:** 20-Q56 (ISO 27001 $=$ Information Security Management — cross-listed §F) · 25-Q73/74/77/79 (VR $=$ multimedia-created, user-interactive, **and** multi-sense-stimulating, "1,2,3" true; multimedia components $=$ text+video+audio+graphics+animation, **all five** — "all five" is the frequent correct answer whenever the option list offers a count-based choice like this; virtual memory provides large addressable space **and** efficient multi-user sharing, **not** "large secondary memory" per se (that's disk, a category-confusion trap); Wi-Fi $=$ 802.11, repeat) · 26-Q76 (phishing scenario, cross-listed §F).

---

## Recycled / repeated PYQs

- **Octal $6251\to$ hex $=$ CA9**: 2019-Q78, 2023-Q79 — identical number, identical answer, 4 years apart.
- **2's complement of $-59$ (8-bit) $=11000101$**: 2022-Q35, 2024-Q46.
- **ARP is Network-layer, resolves IP↔MAC**: tested independently in 2020, 2024, 2026 — the single most-recycled individual fact in this file.
- **"Interpreter translates the whole program first" (false)**: 2018-Q70, 24-Q47 — same misconception, same correction, six years apart.
- **UNIX core $=$ Kernel**: 2018-Q64, 2023-Q74, 2026-Q61 — asked three separate times.
- **Raster-vs-vector, SVG is the odd one out**: 2021-Q60, 2022-Q36 — same 4-option set both times.

---

## Revision priority
1. **E** (networking) — largest single payoff-per-fact-learned bucket; the protocol/layer table alone resolves ~10 questions/year.
2. **C** (OS) — second largest; the paging/segmentation/deadlock/process-state distinctions cover most of it.
3. **A + B** (number systems, architecture) — mechanical once the 5–6 verified conversion templates above are drilled; near-zero conceptual ambiguity.
4. **F** (security) — small but the malware-taxonomy table is a guaranteed 2–3 marks/year for minimal memorisation.
5. **D, G, H, I, J** — lower individual weight; sweep these last as pure vocabulary review, no derivation risk anywhere in this file.
