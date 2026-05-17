-- Seed restaurants
insert into restaurants (name, city, cuisine, email_alias) values
  ('Spice Route', 'Mangalore', 'South Indian', 'Spice Route'),
  ('The Grillhouse', 'Udupi', 'BBQ & Grills', 'Grillhouse'),
  ('Noodle Bar', 'Mangalore', 'Chinese/Pan Asian', 'Noodle Bar'),
  ('Biryani Hub', 'Manipal', 'Mughlai', 'Biryani Hub'),
  ('Coast Kitchen', 'Udupi', 'Seafood', 'Coast Kitchen'),
  ('The Burger Lab', 'Mangalore', 'Fast Food', 'Burger Lab'),
  ('Dosa Factory', 'Manipal', 'South Indian', 'Dosa Factory'),
  ('Mumbai Tiffin', 'Mangalore', 'North Indian', 'Mumbai Tiffin');

-- Seed reviews
insert into reviews (restaurant_id, platform, rating, review_text, customer_name, order_id, severity, status, email_message_id, detected_at, resolved_at) values
  ((select id from restaurants where name = 'Biryani Hub'), 'zomato', 1, 'Found a piece of plastic in my biryani. This is absolutely unacceptable. I am never ordering from here again. Reported to health department.', 'Rahul M.', 'ZO-7723', 'critical', 'open', 'msg001', now() - interval '2 hours', null),
  ((select id from restaurants where name = 'The Grillhouse'), 'swiggy', 2, 'Order arrived 90 minutes late. The food was cold and the grilled chicken was dry. Very disappointed with the service.', 'Priya K.', 'SW-4451', 'high', 'in_progress', 'msg002', now() - interval '45 minutes', null),
  ((select id from restaurants where name = 'Spice Route'), 'zomato', 3, 'Food was okay but portion sizes have reduced significantly. The sambar was too watery today.', 'Arun S.', 'ZO-8912', 'medium', 'resolved', 'msg003', now() - interval '5 hours', now() - interval '3 hours'),
  ((select id from restaurants where name = 'Noodle Bar'), 'zomato', 4, 'Good noodles as always. The hakka noodles were well prepared. Just wish they added more vegetables.', 'Neha P.', 'ZO-4523', 'low', 'open', 'msg004', now() - interval '30 minutes', null),
  ((select id from restaurants where name = 'Coast Kitchen'), 'swiggy', 1, 'The fish smelled rotten. I ate one bite and felt sick immediately. This is a health hazard.', 'Vikram G.', 'SW-6712', 'critical', 'open', 'msg005', now() - interval '15 minutes', null),
  ((select id from restaurants where name = 'The Burger Lab'), 'swiggy', 2, 'Burger was completely burnt. The patty was black on one side. Fries were stale.', 'Sneha R.', 'SW-3345', 'high', 'open', 'msg006', now() - interval '2 hours', null),
  ((select id from restaurants where name = 'Dosa Factory'), 'zomato', 3, 'The masala dosa was decent but the chutney was sour. Might have gone bad. Delivery was on time though.', 'Anand T.', 'ZO-1123', 'medium', 'resolved', 'msg007', now() - interval '8 hours', now() - interval '6 hours'),
  ((select id from restaurants where name = 'Mumbai Tiffin'), 'swiggy', 5, 'Excellent home-style food! The dal khichdi reminded me of my mothers cooking. Highly recommend!', 'Meera D.', 'SW-9987', 'low', 'resolved', 'msg008', now() - interval '1 day', now() - interval '20 hours'),
  ((select id from restaurants where name = 'Biryani Hub'), 'swiggy', 4, 'Good biryani, generous portion. The raita was a bit too salty but overall a satisfying meal.', 'Karthik N.', 'SW-5566', 'low', 'open', 'msg009', now() - interval '3 hours', null),
  ((select id from restaurants where name = 'The Grillhouse'), 'zomato', 1, 'The staff on the delivery note was extremely rude. Called me multiple times shouting about the address. Food was inedible.', 'Divya L.', 'ZO-3390', 'critical', 'open', 'msg010', now() - interval '10 minutes', null),
  ((select id from restaurants where name = 'Spice Route'), 'swiggy', 2, 'Missing items from the order. Ordered a full meal but received only half. No response from restaurant.', 'Ravi J.', 'SW-2234', 'high', 'in_progress', 'msg011', now() - interval '1 hour', null),
  ((select id from restaurants where name = 'Noodle Bar'), 'swiggy', 1, 'Found a hair in the noodles. Absolutely disgusting. How can a restaurant be this careless?', 'Anita W.', 'SW-7788', 'critical', 'open', 'msg012', now() - interval '20 minutes', null),
  ((select id from restaurants where name = 'Coast Kitchen'), 'zomato', 3, 'Prawn curry was tasty but the rice was undercooked. Expected better from Coast Kitchen.', 'Rajesh P.', 'ZO-5678', 'medium', 'in_progress', 'msg013', now() - interval '4 hours', null),
  ((select id from restaurants where name = 'The Burger Lab'), 'zomato', 4, 'Decent burger place. The peri-peri fries are amazing. Would order again.', 'Sahil K.', 'ZO-9012', 'low', 'resolved', 'msg014', now() - interval '2 days', now() - interval '1 day'),
  ((select id from restaurants where name = 'Dosa Factory'), 'swiggy', 2, 'Very disappointed. The ghee roast dosa was dripping in oil. Not authentic at all.', 'Lakshmi M.', 'SW-4450', 'high', 'open', 'msg015', now() - interval '25 minutes', null),
  ((select id from restaurants where name = 'Mumbai Tiffin'), 'zomato', 3, 'The pav bhaji was okay but the pav was hard. Bhaji was a bit too oily. Average experience.', 'Deepak V.', 'ZO-3344', 'medium', 'open', 'msg016', now() - interval '50 minutes', null),
  ((select id from restaurants where name = 'Spice Route'), 'zomato', 5, 'Best South Indian food in Mangalore! The neer dosa and fish curry are to die for. Consistently amazing.', 'Sunita A.', 'ZO-7788', 'low', 'resolved', 'msg017', now() - interval '3 days', now() - interval '2 days'),
  ((select id from restaurants where name = 'Biryani Hub'), 'swiggy', 2, 'Ordered chicken biryani but got veg biryani instead. Wrong order completely ruined my dinner.', 'Farhan Q.', 'SW-1122', 'high', 'open', 'msg018', now() - interval '35 minutes', null),
  ((select id from restaurants where name = 'Noodle Bar'), 'zomato', 5, 'The pan-fried noodles are the best in town. Perfect balance of flavors. Quick delivery too!', 'Maya S.', 'ZO-6655', 'low', 'resolved', 'msg019', now() - interval '4 days', now() - interval '3 days'),
  ((select id from restaurants where name = 'Coast Kitchen'), 'swiggy', 1, 'Severe food poisoning after eating the prawn gassi. Spent the whole night in the hospital. Will take legal action.', 'Joseph K.', 'SW-9900', 'critical', 'in_progress', 'msg020', now() - interval '1 hour', null);

-- Seed action logs for a few reviews
insert into review_actions (review_id, user_id, action_type, note, created_at)
select
  (select id from reviews where email_message_id = 'msg002'),
  (select id from users where role = 'manager' limit 1),
  'called_customer',
  'Called Priya, apologized for the delay. Offered a full refund.',
  now() - interval '30 minutes'
where exists (select 1 from users where role = 'manager');

insert into review_actions (review_id, user_id, action_type, note, created_at)
select
  (select id from reviews where email_message_id = 'msg011'),
  (select id from users where role = 'manager' limit 1),
  'offered_replacement',
  'Sent missing items via priority delivery.',
  now() - interval '40 minutes'
where exists (select 1 from users where role = 'manager');

insert into review_actions (review_id, user_id, action_type, note, created_at)
select
  (select id from reviews where email_message_id = 'msg013'),
  (select id from users where role = 'manager' limit 1),
  'spoke_to_delivery',
  'Spoke to kitchen team about rice preparation.',
  now() - interval '3 hours'
where exists (select 1 from users where role = 'manager');

insert into review_actions (review_id, user_id, action_type, note, created_at)
select
  (select id from reviews where email_message_id = 'msg020'),
  (select id from users where role = 'manager' limit 1),
  'escalated_to_kitchen',
  'Escalated to kitchen head. Investigating food poisoning report.',
  now() - interval '45 minutes'
where exists (select 1 from users where role = 'manager');

insert into review_actions (review_id, user_id, action_type, note, created_at)
select
  (select id from reviews where email_message_id = 'msg003'),
  (select id from users where role = 'manager' limit 1),
  'note',
  'Discussed portion sizes with chef. Will adjust.',
  now() - interval '4 hours'
where exists (select 1 from users where role = 'manager');

-- Update first_action_at for reviews that have actions
update reviews set first_action_at = (
  select min(created_at) from review_actions where review_actions.review_id = reviews.id
) where id in (select review_id from review_actions);
