USE qelmora_store;

INSERT INTO categories (name, slug, description, sort_order) VALUES
('Men', 'men', 'Tailored silhouettes and elevated essentials for men.', 1),
('Women', 'women', 'Refined pieces with quiet confidence.', 2),
('Unisex', 'unisex', 'Gender-neutral staples designed to move with you.', 3),
('New Arrivals', 'new-arrivals', 'The latest drops from QELMORA.', 0)
ON DUPLICATE KEY UPDATE name = VALUES(name), description = VALUES(description), sort_order = VALUES(sort_order);
