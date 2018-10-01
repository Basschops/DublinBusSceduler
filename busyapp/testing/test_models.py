from django.test import TestCase #this inherits from unittest.TestCase
from busyapp import ml
from sklearn.externals import joblib
import datetime
import json

class ModelTest(TestCase):
    #run your setup here (if any)
    def setUp(self):
        pass


    #example test...
    def test_simple_check(self):
        self.assertEqual(1, 1)
        self.assertTrue(True)
        self.assertFalse(False)
        with self.assertRaises(Exception):
            raise Exception

    # Test findModel to return file name
    def test_getModelAndProgNum(self):
        # Assert return pkl reference
        model, start, stop = ml.getModelAndProgNum('46a', 810, 2795, True)
        print("start program number: ",start,",  stop program number: ",stop)
        self.assertTrue(start == 4 and stop == 23)

        # Assert return None if route not found
        self.assertEqual(ml.getModelAndProgNum('3000', 'Phoenix Park', 0, 0, True), None)

        # Assert return None if direction not found
        self.assertEqual(ml.getModelAndProgNum('1', '', 0, 0, True), None)


    def test_getProgNum(self):
        with open('static/bus_data/routes.json') as f:
            data = json.load(f)

            self.assertEqual(ml.getProgNum(data, '46A', 'I', 2795), 12)

            self.assertEqual(ml.getProgNum(data, '7', 'I', 2040), 40)

            self.assertEqual(ml.getProgNum(data, '4', 'I', 7113), 3)

            self.assertEqual(ml.getProgNum(data, '36', 'I', 0), None)


    #run your clean up here (if any)
    def tearDown(self):
        pass