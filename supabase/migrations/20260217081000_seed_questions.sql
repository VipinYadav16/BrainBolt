-- Seed questions with varying difficulties (1-10)
-- These are general knowledge questions across multiple categories

-- Difficulty 1 (Very Easy)
INSERT INTO public.questions (difficulty, prompt, choices, correct_answer, category) VALUES
(1, 'What color is the sky on a clear day?', '["Blue", "Green", "Red", "Yellow"]', 'Blue', 'general'),
(1, 'How many legs does a dog have?', '["2", "4", "6", "8"]', '4', 'science'),
(1, 'What do you use to write on paper?', '["Fork", "Pen", "Spoon", "Hammer"]', 'Pen', 'general'),
(1, 'What is 1 + 1?', '["1", "2", "3", "4"]', '2', 'math'),
(1, 'What animal says "meow"?', '["Dog", "Cat", "Cow", "Horse"]', 'Cat', 'science');

-- Difficulty 2 (Easy)
INSERT INTO public.questions (difficulty, prompt, choices, correct_answer, category) VALUES
(2, 'What is the largest planet in our solar system?', '["Earth", "Mars", "Jupiter", "Venus"]', 'Jupiter', 'science'),
(2, 'How many days are in a week?', '["5", "6", "7", "8"]', '7', 'general'),
(2, 'What is 5 × 3?', '["12", "15", "18", "20"]', '15', 'math'),
(2, 'Which ocean is the largest?', '["Atlantic", "Pacific", "Indian", "Arctic"]', 'Pacific', 'geography'),
(2, 'What is the capital of France?', '["London", "Berlin", "Paris", "Madrid"]', 'Paris', 'geography');

-- Difficulty 3 (Easy-Medium)
INSERT INTO public.questions (difficulty, prompt, choices, correct_answer, category) VALUES
(3, 'What year did World War II end?', '["1943", "1944", "1945", "1946"]', '1945', 'history'),
(3, 'What is the chemical symbol for water?', '["H2O", "CO2", "NaCl", "O2"]', 'H2O', 'science'),
(3, 'Who wrote "Romeo and Juliet"?', '["Charles Dickens", "William Shakespeare", "Jane Austen", "Mark Twain"]', 'William Shakespeare', 'literature'),
(3, 'How many continents are there?', '["5", "6", "7", "8"]', '7', 'geography'),
(3, 'What is 144 ÷ 12?', '["10", "11", "12", "14"]', '12', 'math');

-- Difficulty 4 (Medium)
INSERT INTO public.questions (difficulty, prompt, choices, correct_answer, category) VALUES
(4, 'What is the powerhouse of the cell?', '["Nucleus", "Ribosome", "Mitochondria", "Golgi apparatus"]', 'Mitochondria', 'science'),
(4, 'In what year was the first iPhone released?', '["2005", "2006", "2007", "2008"]', '2007', 'technology'),
(4, 'What is the square root of 169?', '["11", "12", "13", "14"]', '13', 'math'),
(4, 'Which planet is known as the Red Planet?', '["Venus", "Mars", "Jupiter", "Saturn"]', 'Mars', 'science'),
(4, 'Who painted the Mona Lisa?', '["Michelangelo", "Leonardo da Vinci", "Raphael", "Van Gogh"]', 'Leonardo da Vinci', 'art');

-- Difficulty 5 (Medium)
INSERT INTO public.questions (difficulty, prompt, choices, correct_answer, category) VALUES
(5, 'What is the longest river in the world?', '["Amazon", "Nile", "Mississippi", "Yangtze"]', 'Nile', 'geography'),
(5, 'Who developed the theory of relativity?', '["Isaac Newton", "Albert Einstein", "Nikola Tesla", "Stephen Hawking"]', 'Albert Einstein', 'science'),
(5, 'What is the value of Pi to two decimal places?', '["3.12", "3.14", "3.16", "3.18"]', '3.14', 'math'),
(5, 'In which country were the 2016 Summer Olympics held?', '["China", "UK", "Brazil", "Japan"]', 'Brazil', 'sports'),
(5, 'What gas do plants absorb from the atmosphere?', '["Oxygen", "Nitrogen", "Carbon Dioxide", "Hydrogen"]', 'Carbon Dioxide', 'science');

-- Difficulty 6 (Medium-Hard)
INSERT INTO public.questions (difficulty, prompt, choices, correct_answer, category) VALUES
(6, 'What is the atomic number of Carbon?', '["4", "5", "6", "7"]', '6', 'science'),
(6, 'Who wrote "1984"?', '["Aldous Huxley", "George Orwell", "Ray Bradbury", "H.G. Wells"]', 'George Orwell', 'literature'),
(6, 'What is the derivative of x²?', '["x", "2x", "x²", "2x²"]', '2x', 'math'),
(6, 'Which element has the symbol "Au"?', '["Silver", "Gold", "Aluminum", "Argon"]', 'Gold', 'science'),
(6, 'In what year did the Berlin Wall fall?', '["1987", "1988", "1989", "1990"]', '1989', 'history');

-- Difficulty 7 (Hard)
INSERT INTO public.questions (difficulty, prompt, choices, correct_answer, category) VALUES
(7, 'What is the speed of light in km/s (approximately)?', '["200,000", "250,000", "300,000", "350,000"]', '300,000', 'science'),
(7, 'Who discovered penicillin?', '["Louis Pasteur", "Alexander Fleming", "Joseph Lister", "Robert Koch"]', 'Alexander Fleming', 'science'),
(7, 'What is the integral of 1/x dx?', '["x", "1/x²", "ln|x| + C", "e^x"]', 'ln|x| + C', 'math'),
(7, 'Which country has the most time zones?', '["Russia", "USA", "France", "China"]', 'France', 'geography'),
(7, 'What programming language was created by Guido van Rossum?', '["Java", "C++", "Python", "Ruby"]', 'Python', 'technology');

-- Difficulty 8 (Hard)
INSERT INTO public.questions (difficulty, prompt, choices, correct_answer, category) VALUES
(8, 'What is Avogadro''s number (approximately)?', '["6.02 × 10²²", "6.02 × 10²³", "6.02 × 10²⁴", "6.02 × 10²¹"]', '6.02 × 10²³', 'science'),
(8, 'Who proved Fermat''s Last Theorem?', '["Andrew Wiles", "Terence Tao", "Grigori Perelman", "John Nash"]', 'Andrew Wiles', 'math'),
(8, 'What is the time complexity of merge sort?', '["O(n)", "O(n log n)", "O(n²)", "O(log n)"]', 'O(n log n)', 'technology'),
(8, 'In which year was the first email sent?', '["1965", "1971", "1975", "1980"]', '1971', 'technology'),
(8, 'What is the Heisenberg Uncertainty Principle about?', '["Energy conservation", "Position and momentum", "Time dilation", "Wave-particle duality"]', 'Position and momentum', 'science');

-- Difficulty 9 (Very Hard)
INSERT INTO public.questions (difficulty, prompt, choices, correct_answer, category) VALUES
(9, 'What is the Schwarzschild radius formula proportional to?', '["Mass", "Mass squared", "Square root of mass", "Inverse of mass"]', 'Mass', 'science'),
(9, 'Who invented the Fast Fourier Transform algorithm?', '["Cooley and Tukey", "Shannon and Weaver", "Dijkstra", "Knuth"]', 'Cooley and Tukey', 'technology'),
(9, 'What is the sum of angles in a hyperbolic triangle?', '["Less than 180°", "180°", "More than 180°", "360°"]', 'Less than 180°', 'math'),
(9, 'What is the half-life of Carbon-14 (approximately)?', '["1,730 years", "5,730 years", "10,730 years", "15,730 years"]', '5,730 years', 'science'),
(9, 'Which sorting algorithm has the best worst-case time complexity?', '["Quick Sort", "Merge Sort", "Heap Sort", "Bubble Sort"]', 'Merge Sort', 'technology');

-- Difficulty 10 (Expert)
INSERT INTO public.questions (difficulty, prompt, choices, correct_answer, category) VALUES
(10, 'What is the cosmological constant problem related to?', '["Dark matter", "Vacuum energy", "Black holes", "Cosmic inflation"]', 'Vacuum energy', 'science'),
(10, 'What is the Church-Turing thesis about?', '["Quantum computing", "Computability", "Cryptography", "AI"]', 'Computability', 'technology'),
(10, 'What is Gödel''s first incompleteness theorem about?', '["Set theory", "Arithmetic systems", "Geometry", "Probability"]', 'Arithmetic systems', 'math'),
(10, 'What is the P vs NP problem asking?', '["Polynomial time solvability equals verification", "Prime number distribution", "Protein folding", "Parallel processing"]', 'Polynomial time solvability equals verification', 'technology'),
(10, 'What is the Riemann Hypothesis concerned with?', '["Prime number distribution", "Fermat primes", "Mersenne primes", "Twin primes"]', 'Prime number distribution', 'math');

-- Additional questions for more variety (Difficulty 3-7)
INSERT INTO public.questions (difficulty, prompt, choices, correct_answer, category) VALUES
(3, 'What is the smallest prime number?', '["0", "1", "2", "3"]', '2', 'math'),
(3, 'Which country has the largest population?', '["India", "USA", "China", "Indonesia"]', 'China', 'geography'),
(4, 'What is HTTP an abbreviation for?', '["HyperText Transfer Protocol", "High Transfer Text Protocol", "Hyper Transfer Text Protocol", "HyperText Transit Protocol"]', 'HyperText Transfer Protocol', 'technology'),
(4, 'Who painted "Starry Night"?', '["Monet", "Van Gogh", "Picasso", "Rembrandt"]', 'Van Gogh', 'art'),
(5, 'What is the binary representation of 15?', '["1110", "1111", "1101", "1011"]', '1111', 'technology'),
(5, 'What does DNA stand for?', '["Deoxyribonucleic Acid", "Dioxin Nuclear Acid", "Deoxyribose Nucleic Acid", "Dinuclear Amino Acid"]', 'Deoxyribonucleic Acid', 'science'),
(6, 'What is the Big O notation for binary search?', '["O(1)", "O(n)", "O(log n)", "O(n²)"]', 'O(log n)', 'technology'),
(6, 'Who formulated the laws of motion?', '["Kepler", "Newton", "Galileo", "Einstein"]', 'Newton', 'science'),
(7, 'What is the CAP theorem in distributed systems about?', '["Cache, Access, Protocol", "Consistency, Availability, Partition tolerance", "Compute, Analyze, Process", "Create, Append, Push"]', 'Consistency, Availability, Partition tolerance', 'technology'),
(7, 'What is the standard model in physics describing?', '["Planetary motion", "Fundamental particles and forces", "Black holes", "Thermodynamics"]', 'Fundamental particles and forces', 'science');
