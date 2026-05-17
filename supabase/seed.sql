-- RestroWatch Seed Data
-- Run this AFTER creating auth users in Supabase Dashboard

-- 8 Restaurants
insert into restaurants (name, city, cuisine, email_alias) values
  ('Spice Route', 'Mangalore', 'South Indian', 'Spice Route'),
  ('The Grillhouse', 'Udupi', 'BBQ & Grills', 'The Grillhouse'),
  ('Noodle Bar', 'Mangalore', 'Chinese/Pan Asian', 'Noodle Bar'),
  ('Biryani Hub', 'Manipal', 'Mughlai', 'Biryani Hub'),
  ('Coast Kitchen', 'Udupi', 'Seafood', 'Coast Kitchen'),
  ('The Burger Lab', 'Mangalore', 'Fast Food', 'The Burger Lab'),
  ('Dosa Factory', 'Manipal', 'South Indian', 'Dosa Factory'),
  ('Mumbai Tiffin', 'Mangalore', 'North Indian', 'Mumbai Tiffin');

-- NOTE: Users must be created via Supabase Auth first, then linked here.
-- After creating auth users, run:
-- insert into users (id, name, role, restaurant_id) values
--   ('<owner-auth-uuid>', 'Rajesh Kumar', 'owner', null),
--   ('<mgr1-auth-uuid>', 'Arjun Shetty', 'manager', (select id from restaurants where name = 'Spice Route')),
--   ... etc

-- 20 Sample Reviews
-- Using restaurant IDs by name reference
do $$
declare
  r_spice_route uuid;
  r_grillhouse uuid;
  r_noodle_bar uuid;
  r_biryani_hub uuid;
  r_coast_kitchen uuid;
  r_burger_lab uuid;
  r_dosa_factory uuid;
  r_mumbai_tiffin uuid;
begin
  select id into r_spice_route from restaurants where name = 'Spice Route';
  select id into r_grillhouse from restaurants where name = 'The Grillhouse';
  select id into r_noodle_bar from restaurants where name = 'Noodle Bar';
  select id into r_biryani_hub from restaurants where name = 'Biryani Hub';
  select id into r_coast_kitchen from restaurants where name = 'Coast Kitchen';
  select id into r_burger_lab from restaurants where name = 'The Burger Lab';
  select id into r_dosa_factory from restaurants where name = 'Dosa Factory';
  select id into r_mumbai_tiffin from restaurants where name = 'Mumbai Tiffin';

  -- Critical reviews
  insert into reviews (restaurant_id, platform, rating, review_text, customer_name, order_id, severity, status, email_message_id, detected_at)
  values
    (r_biryani_hub, 'zomato', 1, 'Found a hair in my biryani. Absolutely disgusting. This is a health hazard!', 'Rahul M.', 'ZO-7723', 'critical', 'open', 'msg-crit-001', now() - interval '2 hours'),
    (r_spice_route, 'swiggy', 1, 'Food was completely cold and the rice was undercooked. Got stomach ache after eating.', 'Priya K.', 'SW-4412', 'critical', 'in_progress', 'msg-crit-002', now() - interval '5 hours'),
    (r_coast_kitchen, 'zomato', 1, 'Fish smelled off. I think it was spoiled. Threw up after eating this.', 'Amit S.', 'ZO-8891', 'critical', 'open', 'msg-crit-003', now() - interval '30 minutes');

  -- High severity reviews
  insert into reviews (restaurant_id, platform, rating, review_text, customer_name, order_id, severity, status, email_message_id, detected_at)
  values
    (r_grillhouse, 'swiggy', 2, 'Ordered chicken tikka, got mutton instead. Waited 1.5 hours for wrong order.', 'Sneha R.', 'SW-3321', 'high', 'resolved', 'msg-high-001', now() - interval '1 day'),
    (r_noodle_bar, 'zomato', 1, 'Delivery guy was extremely rude. Food was mediocre at best. Won''t order again.', 'Vikram P.', 'ZO-5567', 'high', 'in_progress', 'msg-high-002', now() - interval '3 hours'),
    (r_burger_lab, 'swiggy', 2, 'Burger was completely smashed in the bag. Unrecognizable. Packaging needs serious improvement.', 'Neha T.', 'SW-7788', 'high', 'open', 'msg-high-003', now() - interval '1 hour'),
    (r_dosa_factory, 'zomato', 2, 'Dosa was stale and chutney tasted sour. Clearly not fresh.', 'Kiran N.', 'ZO-2234', 'high', 'open', 'msg-high-004', now() - interval '45 minutes');

  -- Medium severity reviews
  insert into reviews (restaurant_id, platform, rating, review_text, customer_name, order_id, severity, status, email_message_id, detected_at)
  values
    (r_mumbai_tiffin, 'swiggy', 3, 'Butter chicken was good but naan was hard. Delivery took 50 minutes.', 'Deepak L.', 'SW-9901', 'medium', 'resolved', 'msg-med-001', now() - interval '2 days'),
    (r_spice_route, 'zomato', 3, 'Masala dosa was okay, could use more filling. Sambar was nice though.', 'Anita G.', 'ZO-1122', 'medium', 'resolved', 'msg-med-002', now() - interval '1 day'),
    (r_biryani_hub, 'swiggy', 3, 'Portion size has reduced compared to last month. Same price, less food.', 'Farhan A.', 'SW-5543', 'medium', 'open', 'msg-med-003', now() - interval '2 hours'),
    (r_noodle_bar, 'swiggy', 3, 'Hakka noodles were a bit oily. Fried rice was fine. Packaging was leaking.', 'Meera J.', 'SW-6654', 'medium', 'in_progress', 'msg-med-004', now() - interval '4 hours');

  -- Low severity reviews
  insert into reviews (restaurant_id, platform, rating, review_text, customer_name, order_id, severity, status, email_message_id, detected_at)
  values
    (r_grillhouse, 'zomato', 4, 'Good food overall. Just wish they had more vegetarian options on the menu.', 'Rohan D.', 'ZO-3344', 'low', 'resolved', 'msg-low-001', now() - interval '3 days'),
    (r_coast_kitchen, 'swiggy', 4, 'Prawns were fresh and well cooked. Minor delay in delivery but food made up for it.', 'Sanjay B.', 'SW-1122', 'low', 'resolved', 'msg-low-002', now() - interval '2 days'),
    (r_burger_lab, 'zomato', 3, 'Fries were cold but burger was decent. Average experience.', 'Pooja M.', 'ZO-6677', 'low', 'open', 'msg-low-003', now() - interval '6 hours'),
    (r_dosa_factory, 'swiggy', 4, 'Great dosas! Just that the coffee was a bit weak today.', 'Ravi S.', 'SW-8899', 'low', 'resolved', 'msg-low-004', now() - interval '1 day');

  -- More varied reviews
  insert into reviews (restaurant_id, platform, rating, review_text, customer_name, order_id, severity, status, email_message_id, detected_at)
  values
    (r_mumbai_tiffin, 'zomato', 2, 'Dal makhani was too salty. Paneer was rubbery. Disappointed.', 'Kavita W.', 'ZO-9988', 'high', 'open', 'msg-high-005', now() - interval '20 minutes'),
    (r_spice_route, 'swiggy', 4, 'Loved the filter coffee! Idli was soft and sambar was flavorful.', 'Ganesh H.', 'SW-2233', 'low', 'resolved', 'msg-low-005', now() - interval '4 days'),
    (r_biryani_hub, 'zomato', 1, 'Worst biryani I have ever had. Rice was raw and meat was tough. Total waste of money.', 'Imran K.', 'ZO-4455', 'critical', 'open', 'msg-crit-004', now() - interval '15 minutes');

  -- Add action logs for some reviews
  insert into review_actions (review_id, user_id, action_type, note, created_at)
  select id, (select id from users limit 1), 'escalated_to_kitchen', 'Informed kitchen supervisor about hygiene complaint', now() - interval '1 hour 50 minutes'
  from reviews where email_message_id = 'msg-crit-001';

  insert into review_actions (review_id, user_id, action_type, note, created_at)
  select id, (select id from users limit 1), 'called_customer', 'Called Rahul, apologized and offered full refund + free meal next visit', now() - interval '1 hour 40 minutes'
  from reviews where email_message_id = 'msg-crit-001';

  insert into review_actions (review_id, user_id, action_type, note, created_at)
  select id, (select id from users limit 1), 'offered_refund', 'Processed full refund of Rs. 380', now() - interval '1 hour 30 minutes'
  from reviews where email_message_id = 'msg-crit-001';

  insert into review_actions (review_id, user_id, action_type, note, created_at)
  select id, (select id from users limit 1), 'called_customer', 'Spoke with Priya, arranged pickup of cold food, issuing refund', now() - interval '4 hours 30 minutes'
  from reviews where email_message_id = 'msg-crit-002';

  insert into review_actions (review_id, user_id, action_type, note, created_at)
  select id, (select id from users limit 1), 'offered_refund', 'Refund processed for order SW-4412', now() - interval '4 hours'
  from reviews where email_message_id = 'msg-crit-002';

  -- Update resolved reviews
  update reviews set status = 'resolved', resolved_at = now() - interval '20 hours'
  where email_message_id = 'msg-high-001';

  update reviews set status = 'resolved', resolved_at = now() - interval '1 day 20 hours'
  where email_message_id = 'msg-med-001';

  update reviews set status = 'resolved', resolved_at = now() - interval '22 hours'
  where email_message_id = 'msg-med-002';

  update reviews set status = 'resolved', resolved_at = now() - interval '2 days 20 hours'
  where email_message_id = 'msg-low-001';

  update reviews set status = 'resolved', resolved_at = now() - interval '1 day 20 hours'
  where email_message_id = 'msg-low-002';

  update reviews set status = 'resolved', resolved_at = now() - interval '22 hours'
  where email_message_id = 'msg-low-004';

  update reviews set status = 'resolved', resolved_at = now() - interval '3 days 20 hours'
  where email_message_id = 'msg-low-005';

  -- Initialize gmail_sync
  insert into gmail_sync (last_history_id, last_synced_at)
  values ('0', now());

end $$;
